const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const nfc = require('../../utils/nfc')

Page({
  data: {
    stations: [],
    completed: 0,
    progressTitle: '准备出发',
    ctaLabel: '开始漫步',
    nfcVisible: false,
    nfcLoading: false,
    currentStation: null
  },

  onLoad() {
    this.refreshProgress()
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
      ctaLabel
    })
  },

  handleStart() {
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
        wx.vibrateShort({ type: 'medium' })
        this.enterCurrentStation()
      })
      .catch((error) => {
        this.setData({ nfcLoading: false })
        const unsupported = error && error.message === 'NFC_UNSUPPORTED'
        wx.showModal({
          title: unsupported ? '当前设备不支持 NFC' : '暂未读取到标签',
          content: unsupported ? '请在支持 NFC 的安卓设备上体验真实感应，当前可使用模拟入口继续联调。' : '请将手机顶部贴近标牌后重试，也可以使用模拟入口继续。',
          confirmText: '模拟继续',
          cancelText: '重新感应',
          confirmColor: '#005D46',
          success: (result) => {
            if (result.confirm) this.simulateNfc()
          }
        })
      })
  },

  simulateNfc() {
    if (this.data.nfcLoading) return
    this.setData({ nfcLoading: true })
    setTimeout(() => {
      wx.vibrateShort({ type: 'medium' })
      this.enterCurrentStation()
    }, 650)
  },

  enterCurrentStation() {
    const index = this.data.currentStation.id - 1
    this.setData({ nfcVisible: false, nfcLoading: false })
    wx.navigateTo({ url: `/pages/action/action?station=${index}` })
  },

  manualCheckIn() {
    const index = this.data.currentStation.id - 1
    this.setData({ nfcVisible: false })
    wx.navigateTo({ url: `/pages/action/action?station=${index}&manual=1` })
  },

  demoComplete() {
    wx.showModal({
      title: '演示完赛',
      content: '将直接完成全部 3 个点位，用于快速查看完赛凭证。',
      confirmText: '继续演示',
      confirmColor: '#005D46',
      success: (result) => {
        if (!result.confirm) return
        let progress = progressStore.startRoute()
        stations.forEach((station, index) => {
          progress = progressStore.completeStation(index)
        })
        this.refreshProgress()
        wx.navigateTo({ url: '/pages/certificate/certificate' })
      }
    })
  }
})
