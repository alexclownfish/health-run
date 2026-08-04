const progressStore = require('../../utils/progress')
const { formatClock } = require('../../utils/format')

Page({
  data: {
    stats: progressStore.deriveStats(),
    progressStyle: '50%',
    recentActivities: []
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
    const recentActivities = []
    if (progress.completed > 0) {
      recentActivities.push({
        day: '04',
        month: 'AUG',
        title: progress.completed === 3 ? '午间漫步 · 健康同行' : '午间漫步 · 进行中',
        detail: `${stats.distance} km · ${progress.completed}/3 点位 · ${formatClock(progress.completedAt || progress.startedAt)}`,
        status: progress.completed === 3 ? '完成' : '进行中'
      })
    }
    recentActivities.push({
      day: '31',
      month: 'JUL',
      title: '园区活力路线',
      detail: '0.86 km · 16 分钟',
      status: '完成'
    })
    this.setData({ stats, progressStyle: `${stats.percent}%`, recentActivities })
  }
})
