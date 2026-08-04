const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')

Page({
  data: {
    station: stations[0],
    stationIndex: 0,
    photoPath: '',
    privacyAccepted: true,
    submitting: false,
    successVisible: false,
    completed: 0,
    successProgress: 0,
    continueLabel: '查看下一站'
  },

  onLoad(options) {
    const stationIndex = Math.min(Math.max(Number(options.station) || 0, 0), 2)
    const progress = progressStore.readProgress()
    if (stationIndex > progress.completed) {
      wx.showToast({ title: '请按路线依次打卡', icon: 'none' })
      setTimeout(() => wx.navigateBack({ delta: 2 }), 900)
      return
    }
    this.setData({ stationIndex, station: stations[stationIndex] })
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (result) => {
        const file = result.tempFiles && result.tempFiles[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
          wx.showToast({ title: '照片不能超过 10MB', icon: 'none' })
          return
        }
        this.setData({ photoPath: file.tempFilePath })
      },
      fail: (error) => {
        if (!error.errMsg || !error.errMsg.includes('cancel')) {
          wx.showToast({ title: '暂时无法选择照片', icon: 'none' })
        }
      }
    })
  },

  previewPhoto() {
    if (!this.data.photoPath) return
    wx.previewImage({ current: this.data.photoPath, urls: [this.data.photoPath] })
  },

  togglePrivacy() {
    this.setData({ privacyAccepted: !this.data.privacyAccepted })
  },

  submitPoint() {
    if (this.data.submitting) return
    if (!this.data.privacyAccepted) {
      wx.showToast({ title: '请先确认照片隐私设置', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    this.persistPhoto((savedPath) => {
      const progress = progressStore.completeStation(this.data.stationIndex, savedPath)
      this.setData({
        submitting: false,
        successVisible: true,
        completed: progress.completed,
        successProgress: Math.round(progress.completed / 3 * 100),
        continueLabel: progress.completed === 3 ? '生成完赛凭证' : '查看下一站'
      })
      wx.vibrateShort({ type: 'medium' })
    })
  },

  persistPhoto(callback) {
    if (!this.data.photoPath) {
      setTimeout(() => callback(''), 450)
      return
    }
    wx.saveFile({
      tempFilePath: this.data.photoPath,
      success: (result) => callback(result.savedFilePath || this.data.photoPath),
      fail: () => callback(this.data.photoPath)
    })
  },

  preventClose() {},

  continueRoute() {
    if (this.data.completed === 3) {
      wx.redirectTo({ url: '/pages/certificate/certificate' })
      return
    }
    wx.switchTab({ url: '/pages/route/route' })
  }
})
