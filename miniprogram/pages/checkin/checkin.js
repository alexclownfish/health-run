const stations = require('../../utils/stations')
const progressStore = require('../../utils/progress')
const qrValidation = require('../../utils/qr-validation')
const { QR_TAGS } = require('../../utils/qr-tags')

const REASON_CONTENT = {
  NO_CURRENT_STATION: ['暂无待打卡点位', '路线可能已经完成，请返回路线页查看当前进度。'],
  WRONG_POINT: ['点位不匹配', '请扫描当前点位标牌上的二维码。'],
  QR_CANCELLED: ['已取消扫码', '需要打卡时，可重新打开相机扫描点位二维码。'],
  CAMERA_DENIED: ['无法使用相机', '请在系统设置中允许微信使用相机后重试。'],
  QR_SCAN_FAILED: ['扫码启动失败', '请检查相机权限后重新尝试。'],
  QR_INVALID: ['二维码格式无效', '请扫描活动标牌上的点位二维码。'],
  QR_UNKNOWN: ['二维码未登记', '这个二维码不在本次活动清单中。'],
  QR_CONFIG_DUPLICATE: ['二维码配置冲突', '活动二维码清单存在重复配置，请联系现场工作人员。']
}

Page({
  data: {
    state: 'INITIALIZING',
    statusLabel: '正在准备',
    title: '正在读取当前点位',
    message: '请保持页面打开。',
    station: null,
    showPrimary: false,
    showRetry: false,
    showRoute: false,
    success: false
  },

  onLoad() {
    this.pageActive = true
    this.pageUnloaded = false
    this.qrScanActive = false
    this.accepted = false
    this.attemptId = 0
    this.needsReset = false
    this.initializeContext()
  },

  onShow() {
    this.pageActive = true
    if (this.accepted) {
      this.scheduleActionNavigation()
      return
    }
    if (this.needsReset && !this.accepted) {
      this.needsReset = false
      this.initializeContext()
    }
  },

  onHide() {
    this.pageActive = false
    if (this.qrScanActive) return
    this.attemptId += 1
    this.stopPending()
    if (!this.accepted) this.needsReset = true
  },

  onUnload() {
    this.pageActive = false
    this.pageUnloaded = true
    this.qrScanActive = false
    this.attemptId += 1
    this.stopPending()
  },

  stopPending() {
    if (this.navigationTimer) clearTimeout(this.navigationTimer)
    this.navigationTimer = null
  },

  initializeContext() {
    this.stopPending()
    const progress = progressStore.readProgress()
    if (!Number.isInteger(progress.completed) || progress.completed < 0 || progress.completed >= stations.length) {
      this.expectedStationIndex = null
      this.showRejected('NO_CURRENT_STATION', false)
      return
    }

    this.expectedStationIndex = progress.completed
    this.setData({
      state: 'IDLE_QR',
      statusLabel: '等待开始',
      title: `${stations[this.expectedStationIndex].title} · 扫码打卡`,
      message: '点击扫码后，对准现场标牌上的点位二维码。',
      station: stations[this.expectedStationIndex],
      showPrimary: true,
      showRetry: false,
      showRoute: true,
      success: false
    })
  },

  startQrScan() {
    if (this.accepted || this.qrScanActive || this.pageUnloaded || !this.pageActive) return
    this.initializeContext()
    if (!Number.isInteger(this.expectedStationIndex)) return
    if (typeof wx.scanCode !== 'function') {
      this.showRejected('QR_SCAN_FAILED', true)
      return
    }

    const attemptId = ++this.attemptId
    this.qrScanActive = true
    this.setData({
      state: 'SCANNING_QR',
      statusLabel: '打开相机',
      title: `点位 ${this.expectedStationIndex + 1} · 扫描二维码`,
      message: '请对准现场标牌上的点位二维码。',
      showPrimary: false,
      showRetry: false,
      showRoute: false,
      success: false
    })

    const fail = (error) => {
      if (!this.finishQrScan(attemptId)) return
      const result = qrValidation.normalizeScanError(error)
      this.showRejected(result.reasonCode, result.retryable)
    }
    try {
      wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: (result) => {
          if (!this.finishQrScan(attemptId)) return
          this.handleValidationResult(qrValidation.validateQrResult({
            expectedStationIndex: this.expectedStationIndex,
            result,
            qrTags: QR_TAGS
          }), attemptId)
        },
        fail
      })
    } catch (error) {
      fail(error)
    }
  },

  finishQrScan(attemptId) {
    if (this.pageUnloaded || !this.qrScanActive || attemptId !== this.attemptId) return false
    this.qrScanActive = false
    this.pageActive = true
    this.needsReset = false
    return true
  },

  handleValidationResult(result, attemptId) {
    if (!this.pageActive || this.accepted || attemptId !== this.attemptId) return
    if (!result.ok) {
      this.showRejected(result.reasonCode, result.retryable)
      return
    }

    const progress = progressStore.checkInStation(result.stationIndex, 'qr-code', result)
    const checkIn = progress.checkins[String(result.stationIndex)]
    const identityMatches = checkIn && checkIn.qrId === result.qrId
    if (!identityMatches) {
      this.showRejected('WRONG_POINT', false)
      return
    }

    this.accepted = true
    this.acceptedStationIndex = result.stationIndex
    this.stopPending()
    this.setData({
      state: 'ACCEPTED',
      statusLabel: '二维码已核对',
      title: `${stations[result.stationIndex].title} · 打卡成功`,
      message: '点位二维码一致，即将进入动作任务。',
      showPrimary: false,
      showRetry: false,
      showRoute: false,
      success: true
    })
    if (typeof wx.vibrateShort === 'function') wx.vibrateShort({ type: 'medium' })
    this.scheduleActionNavigation()
  },

  scheduleActionNavigation() {
    this.stopPending()
    this.navigationTimer = setTimeout(() => {
      this.navigationTimer = null
      if (!this.pageActive || !this.accepted) return
      wx.redirectTo({ url: `/pages/action/action?station=${this.acceptedStationIndex}` })
    }, 700)
  },

  showRejected(reasonCode, retryable) {
    const content = REASON_CONTENT[reasonCode] || ['暂时无法打卡', '请返回路线页后重新尝试。']
    this.setData({
      state: 'REJECTED',
      statusLabel: '未完成打卡',
      title: content[0],
      message: content[1],
      showPrimary: false,
      showRetry: Boolean(retryable),
      showRoute: true,
      success: false
    })
  },

  retry() {
    if (this.accepted) return
    this.pageActive = true
    this.startQrScan()
  },

  goRoute() {
    this.attemptId += 1
    this.qrScanActive = false
    this.stopPending()
    wx.switchTab({ url: '/pages/route/route' })
  }
})
