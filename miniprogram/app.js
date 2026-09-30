const progress = require('./utils/progress')
const userStore = require('./utils/user')

App({
  globalData: {
    routeId: 'route-01',
    user: userStore.defaultUser()
  },

  onLaunch() {
    progress.ensureProgress()
    this.globalData.user = userStore.readUser()
  }
})
