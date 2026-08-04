const progress = require('./utils/progress')

App({
  globalData: {
    routeId: 'route-01',
    user: {
      name: '林小跑',
      department: '产品设计部',
      level: 4,
      energy: 680
    }
  },

  onLaunch() {
    progress.ensureProgress()
  }
})
