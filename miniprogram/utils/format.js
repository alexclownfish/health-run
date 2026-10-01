function pad(value) {
  return String(value).padStart(2, '0')
}

function formatClock(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date()
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateCode(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date()
  return `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

function formatTimer(seconds) {
  return `00:${pad(Math.max(0, seconds))}`
}

function formatDuration(startedAt, completedAt) {
  const start = Number(startedAt)
  const end = Number(completedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end < start) return '--'
  const totalSeconds = Math.floor((end - start) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds % 3600 / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function getActivityContext(timestamp = Date.now()) {
  const date = new Date(timestamp)
  const hour = date.getHours()
  const periods = hour < 6 ? ['夜间恢复', '适合轻柔拉伸'] : hour < 11 ? ['晨间唤醒', '适合开启活力'] : hour < 14 ? ['午间漫步', '适合轻运动'] : hour < 18 ? ['下午松弛', '适合走出工位'] : ['晚间放松', '适合舒缓收尾']
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return {
    title: periods[0],
    subtitle: `${date.getMonth() + 1}月${date.getDate()}日 周${weekdays[date.getDay()]} · ${formatClock(timestamp)}`,
    scoreLabel: periods[1]
  }
}

function getMonthGrid(year = new Date().getFullYear(), month = new Date().getMonth(), activeDates = []) {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const active = new Set(activeDates)
  const today = new Date()
  const cells = []
  for (let index = 0; index < offset; index += 1) cells.push({ key: `blank-start-${index}`, day: '', muted: true })
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
    cells.push({
      key: `day-${day}`,
      day,
      today: isToday,
      active: active.has(`${year}-${pad(month + 1)}-${pad(day)}`)
    })
  }
  while (cells.length % 7 !== 0) cells.push({ key: `blank-end-${cells.length}`, day: '', muted: true })
  return { year, month, monthLabel: `${year}.${pad(month + 1)}`, cells }
}

function dateKey(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

module.exports = { pad, formatClock, formatDateCode, formatTimer, formatDuration, getActivityContext, getMonthGrid, dateKey }
