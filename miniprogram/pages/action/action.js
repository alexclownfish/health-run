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
    timerComplete: false,
    actionStarted: false,
    actionComplete: false
  },

  onLoad(options) {
    const index = Math.min(Math.max(Number(options.station) || 0, 0), 2)
    const progress = progressStore.readProgress()
    const action = progress.actions[String(index)]
    if (index !== progress.completed || !progressStore.hasValidCheckIn(progress, index)) {
      wx.showToast({ title: '请先完成扫码打卡', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 900)
      return
    }
    const station = stations[index]
    this.setData({
      station,
      stationIndex: index,
      secondsLeft: station.duration,
      timerText: formatTimer(station.duration),
      actionStarted: Boolean(action && action.startedAt),
      actionComplete: Boolean(action && action.completedAt),
      timerComplete: Boolean(action && action.completedAt)
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
    if (this.data.actionComplete) return
    if (!this.data.actionStarted) {
      const started = progressStore.startAction(this.data.stationIndex)
      if (!started.actions[String(this.data.stationIndex)] || !started.actions[String(this.data.stationIndex)].startedAt) {
        wx.showToast({ title: '请重新扫码打卡', icon: 'none' })
        return
      }
      this.setData({ actionStarted: true })
      wx.vibrateShort({ type: 'light' })
    }
    if (this.data.timerRunning) {
      this.stopTimer()
      this.setData({ timerRunning: false })
      wx.vibrateShort({ type: 'light' })
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
        progressStore.completeAction(this.data.stationIndex)
        this.setData({ timerRunning: false, timerComplete: true, actionComplete: true })
        wx.vibrateShort({ type: 'heavy' })
        wx.showToast({ title: '动作计时完成', icon: 'success' })
      }
    }, 1000)
  },

  goUpload() {
    if (!this.data.actionComplete) {
      wx.showToast({ title: '完成动作计时后才能拍照', icon: 'none' })
      wx.vibrateShort({ type: 'light' })
      return
    }
    this.stopTimer()
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ url: `/pages/upload/upload?station=${this.data.stationIndex}` })
  }
})
