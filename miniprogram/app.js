const progress = require('./utils/progress')
const userStore = require('./utils/user')
const completionReport = require('./utils/completion-report')
const routeData = require('./utils/route')

App({
  globalData: {
    routeId: routeData.ROUTE_ID,
    user: userStore.defaultUser()
  },

  onLaunch() {
    progress.ensureProgress()
    this.globalData.user = userStore.readUser()
    completionReport.report(progress.readProgress())
  },

  onShow() {
    completionReport.report(progress.readProgress())
  }
})
