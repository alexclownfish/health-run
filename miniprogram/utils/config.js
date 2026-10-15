const { ROUTE_VERSION } = require('./route')

module.exports = {
  completionReporting: {
    enabled: true,
    functionName: 'submitCompletion',
    targets: {
      test: {
        enabled: false,
        envId: 'cloudbase-d2gd1ocuha5342ad6',
        activityId: 'health-run-test-20261011',
        routeVersion: ROUTE_VERSION
      },
      production: {
        enabled: true,
        envId: 'health-run-d1gj2x9lm0e9ca17b',
        activityId: 'health-run-2026-event01',
        routeVersion: ROUTE_VERSION
      }
    }
  }
}
