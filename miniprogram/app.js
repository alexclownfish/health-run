const progress = require('./utils/progress')
const userStore = require('./utils/user')
const config = require('./utils/config')

App({
  globalData: {
    routeId: 'route-01',
    user: userStore.defaultUser()
  },

  onLaunch() {
    progress.ensureProgress()
    this.globalData.user = userStore.readUser()
    if (config.cloudEnvId && wx.cloud && typeof wx.cloud.init === 'function') {
      wx.cloud.init({ env: config.cloudEnvId, traceUser: true })
    }
  }
})
