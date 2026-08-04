const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const { getMonthGrid, dateKey, formatClock } = require('../../utils/format')

Page({
  data: {
    stats: progressStore.deriveStats(),
    progressStyle: '0%',
    recentActivities: [],
    calendar: getMonthGrid(),
    monthOffset: 0,
    canGoNext: false
  },

  onShow() {
    this.refreshStats()
  },

  onPullDownRefresh() {
    this.refreshStats()
    wx.stopPullDownRefresh()
  },

  refreshStats() {
    const progress = progressStore.readProgress()
    const stats = progressStore.deriveStats(progress)
    const history = progress.history.slice().sort((left, right) => right.at - left.at)
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const recentActivities = history.slice(0, 8).map((entry) => {
      const date = new Date(entry.at)
      const station = stations[entry.station - 1]
      return {
        day: String(date.getDate()).padStart(2, '0'),
        month: monthNames[date.getMonth()],
        title: station ? `点位 ${entry.station} · ${station.title}` : '健康点位',
        detail: `${Number(entry.distance).toFixed(2)} km · ${formatClock(entry.at)}`,
        status: '完成'
      }
    })
    const target = this.getTargetMonth()
    const activeDates = history.map((entry) => dateKey(entry.at))
    this.setData({
      stats,
      progressStyle: `${stats.percent}%`,
      recentActivities,
      calendar: getMonthGrid(target.year, target.month, activeDates),
      canGoNext: this.data.monthOffset < 0
    })
  },

  getTargetMonth() {
    const now = new Date()
    const target = new Date(now.getFullYear(), now.getMonth() + this.data.monthOffset, 1)
    return { year: target.getFullYear(), month: target.getMonth() }
  },

  previousMonth() {
    this.setData({ monthOffset: this.data.monthOffset - 1 }, () => this.refreshStats())
  },

  nextMonth() {
    if (this.data.monthOffset >= 0) return
    this.setData({ monthOffset: this.data.monthOffset + 1 }, () => this.refreshStats())
  }
})
