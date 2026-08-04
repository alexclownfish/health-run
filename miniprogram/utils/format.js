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

module.exports = { pad, formatClock, formatDateCode, formatTimer }
