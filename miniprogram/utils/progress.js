const KEY = 'patchwalk-progress-v1'

function defaultProgress() {
  return {
    completed: 0,
    startedAt: 0,
    completedAt: 0,
    photos: {},
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
    photos: source.photos && typeof source.photos === 'object' ? source.photos : {},
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
  saveProgress(current)
  return current
}

function startRoute() {
  const current = readProgress()
  if (!current.startedAt) current.startedAt = Date.now()
  return saveProgress(current)
}

function completeStation(index, photoPath) {
  const current = readProgress()
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), 2)
  if (safeIndex > current.completed) return current
  current.completed = Math.max(current.completed, safeIndex + 1)
  if (photoPath) current.photos[String(safeIndex)] = photoPath
  if (!current.startedAt) current.startedAt = Date.now()
  if (current.completed === 3 && !current.completedAt) current.completedAt = Date.now()
  return saveProgress(current)
}

function resetProgress() {
  const next = defaultProgress()
  saveProgress(next)
  return next
}

function deriveStats(value) {
  const current = normalizeProgress(value)
  const complete = current.completed === 3
  return {
    energy: complete ? 260 : 60 + current.completed * 20,
    percent: complete ? 86 : 40 + current.completed * 10,
    distance: complete ? '1.02' : (current.completed * 0.3).toFixed(1),
    calories: complete ? 68 : current.completed * 18,
    points: current.completed
  }
}

module.exports = {
  KEY,
  defaultProgress,
  normalizeProgress,
  readProgress,
  saveProgress,
  ensureProgress,
  startRoute,
  completeStation,
  resetProgress,
  deriveStats
}
