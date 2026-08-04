const progressStore = require('../../utils/progress')

Page({
  data: {
    user: {},
    completed: 0,
    reminderEnabled: true
  },

  onShow() {
    const app = getApp()
    const progress = progressStore.readProgress()
    this.setData({ user: app.globalData.user, completed: progress.completed })
  },

  toggleReminder() {
    this.setData({ reminderEnabled: !this.data.reminderEnabled })
    wx.showToast({
      title: this.data.reminderEnabled ? '活动提醒已开启' : '活动提醒已关闭',
      icon: 'none'
    })
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私与照片',
      content: '打卡照片仅保存在本机临时目录和本次活动记录中，当前版本不会上传到服务器或公开展示。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#005D46'
    })
  },

  resetProgress() {
    wx.showModal({
      title: '重置演示进度',
      content: '将清除当前路线进度与照片记录，重新体验完整流程。',
      confirmText: '确认重置',
      confirmColor: '#E55B40',
      success: (result) => {
        if (!result.confirm) return
        progressStore.resetProgress()
        this.setData({ completed: 0 })
        wx.showToast({ title: '进度已重置', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/route/route' }), 650)
      }
    })
  },

  showPlaceholder() {
    wx.showToast({ title: '功能将在正式版开放', icon: 'none' })
  }
})
