const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const photoService = require('../../utils/photo')

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
    storageNotice: '',
    continueLabel: '查看下一站'
  },

  onLoad(options) {
    const stationIndex = Math.min(Math.max(Number(options.station) || 0, 0), 2)
    const progress = progressStore.readProgress()
    if (stationIndex !== progress.completed || !progressStore.canUpload(progress, stationIndex)) {
      wx.showToast({ title: '请先完成动作计时', icon: 'none' })
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
        wx.vibrateShort({ type: 'light' })
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
    if (!this.data.photoPath) {
      wx.showToast({ title: '请先拍照或选择照片', icon: 'none' })
      wx.vibrateShort({ type: 'light' })
      return
    }

    this.setData({ submitting: true })
    photoService.uploadCheckInPhoto(this.data.photoPath, this.data.stationIndex)
      .then((savedPath) => {
      const savedLocally = typeof savedPath === 'string' && savedPath.startsWith('local://')
      const progress = progressStore.completeStation(this.data.stationIndex, savedPath)
      if (progress.completed <= this.data.stationIndex) {
        this.setData({ submitting: false })
        wx.showToast({ title: '上传状态失效，请重新完成动作', icon: 'none' })
        return
      }
      this.setData({
        submitting: false,
        successVisible: true,
        completed: progress.completed,
        successProgress: Math.round(progress.completed / 3 * 100),
        storageNotice: savedLocally ? '云端暂不可用，照片已保存到本机' : '照片已保存至微信云端',
        continueLabel: progress.completed === 3 ? '生成完赛凭证' : '查看下一站'
      })
      wx.vibrateShort({ type: 'medium' })
      })
      .catch((error) => {
        this.setData({ submitting: false })
        wx.vibrateShort({ type: 'heavy' })
        const errorCode = error && error.code && error.code !== 'UNKNOWN' ? `\n错误码：${error.code}` : ''
        wx.showModal({
          title: '照片上传失败',
          content: `请检查网络、存储空间或云开发配置后重试。照片未保存成功，本点位不会解锁。${errorCode}`,
          showCancel: false,
          confirmColor: '#005D46'
        })
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
