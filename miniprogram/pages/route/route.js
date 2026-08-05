const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const nfc = require('../../utils/nfc')
const userStore = require('../../utils/user')
const { getActivityContext } = require('../../utils/format')

Page({
  data: {
    stations: [],
    completed: 0,
    progressTitle: '准备出发',
    ctaLabel: '开始漫步',
    nfcVisible: false,
    nfcLoading: false,
    currentStation: null,
    user: userStore.defaultUser(),
    userInitial: '我',
    activity: getActivityContext(),
    showSimulation: false,
    profileVisible: false
  },

  onLoad() {
    const account = typeof wx.getAccountInfoSync === 'function' ? wx.getAccountInfoSync() : null
    const envVersion = account && account.miniProgram ? account.miniProgram.envVersion : 'release'
    this.setData({ showSimulation: envVersion === 'develop' })
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
    this.openNfc(this.data.completed)
  },

  handleStationTap(event) {
    const index = Number(event.currentTarget.dataset.index)
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
    this.openNfc(index)
  },

  openNfc(index) {
    this.setData({
      currentStation: stations[index],
      nfcVisible: true,
      nfcLoading: false
    })
  },

  closeNfc() {
    if (this.data.nfcLoading) return
    this.setData({ nfcVisible: false })
  },

  preventClose() {},

  scanNfc() {
    if (this.data.nfcLoading) return
    this.setData({ nfcLoading: true })
    nfc.discoverOnce(8000)
      .then(() => {
        this.enterCurrentStation('nfc')
      })
      .catch((error) => {
        this.setData({ nfcLoading: false })
        const unsupported = error && error.message === 'NFC_UNSUPPORTED'
        wx.showModal({
          title: unsupported ? '当前设备不支持 NFC' : '暂未读取到标签',
          content: unsupported ? '请在支持 NFC 的安卓设备上体验真实感应。当前设备无法继续本次打卡。' : '请将手机顶部贴近标牌后重试。',
          confirmText: '知道了',
          cancelText: '重试',
          confirmColor: '#005D46',
          success: () => {}
        })
      })
  },

  simulateNfc() {
    if (this.data.nfcLoading) return
    this.setData({ nfcLoading: true })
    setTimeout(() => {
      this.enterCurrentStation('simulation')
    }, 650)
  },

  enterCurrentStation(source) {
    const index = this.data.currentStation.id - 1
    progressStore.checkInStation(index, source)
    wx.vibrateShort({ type: 'medium' })
    this.setData({ nfcVisible: false, nfcLoading: false })
    wx.navigateTo({ url: `/pages/action/action?station=${index}` })
  },
})
