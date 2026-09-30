const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const userStore = require('../../utils/user')
const { getActivityContext } = require('../../utils/format')

Page({
  data: {
    stations: [],
    completed: 0,
    progressTitle: '准备出发',
    ctaLabel: '开始漫步',
    user: userStore.defaultUser(),
    userInitial: '我',
    activity: getActivityContext(),
    profileVisible: false
  },

  onLoad() {
    this.refreshProgress()
    const user = userStore.readUser()
    if (!userStore.isProfileComplete(user)) this.setData({ profileVisible: true })
  },

  onShow() {
    this.refreshProgress()
  },

  onPullDownRefresh() {
    this.refreshProgress()
    wx.stopPullDownRefresh()
  },

  refreshProgress() {
    const progress = progressStore.readProgress()
    const viewStations = stations.map((station, index) => ({
      ...station,
      index,
      number: String(index + 1).padStart(2, '0'),
      done: index < progress.completed,
      current: index === progress.completed && progress.completed < 3,
      locked: index > progress.completed,
      status: index < progress.completed ? 'DONE' : index === progress.completed ? 'NEXT' : 'LOCKED'
    }))

    const progressTitle = progress.completed === 0
      ? '准备出发'
      : progress.completed === 3
        ? '路线已完成'
        : `下一站 · ${stations[progress.completed].title}`
    const ctaLabel = progress.completed === 0
      ? '开始漫步'
      : progress.completed === 3
        ? '查看完赛凭证'
        : `前往点位 ${progress.completed + 1}`

    this.setData({
      stations: viewStations,
      completed: progress.completed,
      progressTitle,
      ctaLabel,
      user: userStore.readUser(),
      userInitial: this.getUserInitial(userStore.readUser()),
      activity: getActivityContext()
    })
  },

  getUserInitial(user) {
    return user && user.nickName ? user.nickName.charAt(0) : '我'
  },

  openProfileAuthorization() {
    this.setData({ profileVisible: true })
  },

  closeProfileAuthorization() {
    this.setData({ profileVisible: false })
  },

  saveAuthorizedProfile(event) {
    const user = userStore.saveUser(event.detail && event.detail.user)
    getApp().globalData.user = user
    this.setData({
      user,
      userInitial: this.getUserInitial(user),
      profileVisible: false
    })
    wx.showToast({ title: '微信资料已保存', icon: 'success' })
  },

  handleStart() {
    wx.vibrateShort({ type: 'light' })
    if (this.data.completed === 3) {
      wx.navigateTo({ url: '/pages/certificate/certificate' })
      return
    }
    progressStore.startRoute()
    this.openCheckin()
  },

  handleStationTap(event) {
    const index = event.detail && event.detail.index !== undefined
      ? Number(event.detail.index)
      : Number(event.currentTarget.dataset.index)
    const station = this.data.stations[index]
    if (!station || station.locked) {
      wx.showToast({ title: '请按路线依次打卡', icon: 'none' })
      return
    }
    if (station.done) {
      wx.showToast({ title: '该点位已完成', icon: 'success' })
      return
    }
    wx.vibrateShort({ type: 'light' })
    this.openCheckin()
  },

  openCheckin() {
    wx.navigateTo({ url: '/pages/checkin/checkin' })
  }
})
