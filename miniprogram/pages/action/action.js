const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const { formatTimer } = require('../../utils/format')

Page({
  data: {
    station: stations[0],
    stationIndex: 0,
    timerText: '00:10',
    secondsLeft: 10,
    timerRunning: false,
    timerComplete: false
  },

  onLoad(options) {
    const index = Math.min(Math.max(Number(options.station) || 0, 0), 2)
    const progress = progressStore.readProgress()
    if (index > progress.completed) {
      wx.showToast({ title: '请按路线依次打卡', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 900)
      return
    }
    const station = stations[index]
    this.setData({
      station,
      stationIndex: index,
      secondsLeft: station.duration,
      timerText: formatTimer(station.duration)
    })
  },

  onUnload() {
    this.stopTimer()
  },

  stopTimer() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  },

  toggleTimer() {
    if (this.data.timerRunning) {
      this.stopTimer()
      this.setData({ timerRunning: false })
      return
    }
    if (this.data.timerComplete) {
      this.setData({
        secondsLeft: this.data.station.duration,
        timerText: formatTimer(this.data.station.duration),
        timerComplete: false
      })
    }
    this.setData({ timerRunning: true })
    this.timer = setInterval(() => {
      const secondsLeft = this.data.secondsLeft - 1
      this.setData({ secondsLeft, timerText: formatTimer(secondsLeft) })
      if (secondsLeft <= 0) {
        this.stopTimer()
        this.setData({ timerRunning: false, timerComplete: true })
        wx.vibrateShort({ type: 'medium' })
        wx.showToast({ title: '动作计时完成', icon: 'success' })
      }
    }, 1000)
  },

  goUpload() {
    this.stopTimer()
    wx.navigateTo({ url: `/pages/upload/upload?station=${this.data.stationIndex}` })
  }
})
