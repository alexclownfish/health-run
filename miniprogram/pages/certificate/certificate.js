const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const { formatClock, formatDateCode } = require('../../utils/format')
const userStore = require('../../utils/user')

Page({
  data: {
    stations,
    certificateId: '',
    completedTime: '',
    completed: 0,
    certificateReady: false,
    ownerName: '微信用户'
  },

  onLoad() {
    this.refreshCertificate()
  },

  onShow() {
    this.refreshCertificate()
  },

  refreshCertificate() {
    const progress = progressStore.readProgress()
    const timestamp = progress.completedAt || Date.now()
    this.setData({
      completed: progress.completed,
      certificateReady: progress.completed === 3,
      certificateId: formatDateCode(timestamp),
      completedTime: formatClock(timestamp),
      ownerName: userStore.readUser().nickName || '微信用户'
    })
  },

  backHome() {
    wx.switchTab({ url: '/pages/route/route' })
  },

  saveCertificate() {
    wx.showModal({
      title: '保存完赛凭证',
      content: '当前版本已生成可分享的小程序凭证页。接入正式 AppID 后，可扩展 Canvas 高清海报并保存到相册。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#005D46'
    })
  },

  onShareAppMessage() {
    return {
      title: '我完成了午间漫步健康路线，3/3 点位全部打卡！',
      path: '/pages/route/route'
    }
  },

  onShareTimeline() {
    return { title: '午间漫步 · 健康同行' }
  }
})
