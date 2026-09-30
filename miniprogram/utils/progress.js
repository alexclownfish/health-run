const KEY = 'patchwalk-progress-v2'
const routeData = require('./route')
const ROUTE_DISTANCE = routeData.TASK_DISTANCE_KM

function defaultProgress() {
  return {
    completed: 0,
    startedAt: 0,
    completedAt: 0,
    checkins: {},
    actions: {},
    photos: {},
    history: [],
    routeId: 'route-01'
  }
}

function normalizeProgress(value) {
  const source = value && typeof value === 'object' ? value : {}
  const completed = Number.isFinite(Number(source.completed))
    ? Math.min(Math.max(Number(source.completed), 0), 3)
    : 0
  return {
    completed,
    startedAt: Number(source.startedAt) || 0,
    completedAt: Number(source.completedAt) || 0,
    checkins: source.checkins && typeof source.checkins === 'object' ? source.checkins : {},
    actions: source.actions && typeof source.actions === 'object' ? source.actions : {},
    photos: source.photos && typeof source.photos === 'object' ? source.photos : {},
    history: Array.isArray(source.history) ? source.history : [],
    routeId: source.routeId || 'route-01'
  }
}

function readProgress() {
  try {
    return normalizeProgress(wx.getStorageSync(KEY))
  } catch (error) {
    return defaultProgress()
  }
}

function saveProgress(value) {
  const next = normalizeProgress(value)
  wx.setStorageSync(KEY, next)
  return next
}

function ensureProgress() {
  const current = readProgress()
  return saveProgress(current)
}

function startRoute() {
  const current = readProgress()
  if (!current.startedAt) current.startedAt = Date.now()
  return saveProgress(current)
}

function checkInStation(index, source = 'qr-code', metadata = {}) {
  const current = startRoute()
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), 2)
  if (safeIndex !== current.completed) return current
  const key = String(safeIndex)
  const evidence = metadata && typeof metadata === 'object' ? metadata : {}
  const existing = current.checkins[key]
  const existingQrVerified = existing && existing.at &&
    existing.source === 'qr-code' &&
    typeof existing.qrId === 'string' && existing.qrId &&
    typeof existing.pointCode === 'string' && existing.pointCode &&
    existing.assurance === 'LOCAL_QR_MATCH'
  if (existingQrVerified) return current
  current.checkins[key] = {
    at: Date.now(),
    source,
    qrId: typeof evidence.qrId === 'string' ? evidence.qrId : '',
    pointCode: typeof evidence.pointCode === 'string' ? evidence.pointCode : '',
    assurance: typeof evidence.assurance === 'string' ? evidence.assurance : 'LOCAL_QR_MATCH'
  }
  return saveProgress(current)
}

function hasValidCheckIn(value, index, ttl = 20 * 60 * 1000) {
  const current = normalizeProgress(value)
  const record = current.checkins[String(index)]
  return Boolean(record && record.at && Date.now() - record.at <= ttl)
}

function startAction(index) {
  const current = readProgress()
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), 2)
  if (safeIndex !== current.completed || !hasValidCheckIn(current, safeIndex)) return current
  current.actions[String(safeIndex)] = {
    startedAt: Date.now(),
    completedAt: 0
  }
  return saveProgress(current)
}

function completeAction(index) {
  const current = readProgress()
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), 2)
  const action = current.actions[String(safeIndex)]
  if (safeIndex !== current.completed || !action || !action.startedAt) return current
  action.completedAt = Date.now()
  current.actions[String(safeIndex)] = action
  return saveProgress(current)
}

function canUpload(value, index) {
  const current = normalizeProgress(value)
  const action = current.actions[String(index)]
  return Number(index) === current.completed && Boolean(action && action.completedAt)
}

function completeStation(index, photoPath) {
  const current = readProgress()
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), 2)
  if (!canUpload(current, safeIndex) || !photoPath) return current
  current.photos[String(safeIndex)] = photoPath
  current.completed += 1
  current.checkins[String(safeIndex)] = { ...current.checkins[String(safeIndex)], completedAt: Date.now() }
  const completedAt = Date.now()
  if (current.completed === 3) current.completedAt = completedAt
  current.history.push({
    routeId: current.routeId,
    station: safeIndex + 1,
    at: completedAt,
    distance: ROUTE_DISTANCE[safeIndex]
  })
  return saveProgress(current)
}

function resetProgress() {
  const next = defaultProgress()
  return saveProgress(next)
}

function deriveStats(value) {
  const current = normalizeProgress(value)
  const distance = current.completed === 0
    ? 0
    : current.completed === 3
      ? routeData.TOTAL_DISTANCE_KM
      : ROUTE_DISTANCE[current.completed - 1]
  const durationMinutes = current.startedAt
    ? Math.max(1, Math.ceil(((current.completedAt || Date.now()) - current.startedAt) / 60000))
    : 0
  return {
    energy: current.completed * 40,
    percent: Math.round(current.completed / 3 * 100),
    distance: distance.toFixed(2),
    calories: Math.round(distance * 65),
    durationMinutes,
    points: current.completed
  }
}

module.exports = {
  KEY,
  ROUTE_DISTANCE,
  defaultProgress,
  normalizeProgress,
  readProgress,
  saveProgress,
  ensureProgress,
  startRoute,
  checkInStation,
  hasValidCheckIn,
  startAction,
  completeAction,
  canUpload,
  completeStation,
  resetProgress,
  deriveStats
}
