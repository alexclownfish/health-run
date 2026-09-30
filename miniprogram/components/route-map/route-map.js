const routeData = require('../../utils/route')

// The GPX is WGS84; route.js converts it to GCJ-02 for the native WeChat map.
const MAP_POINTS = routeData.getMapPoints()
const MAP_CENTER = routeData.getMapCenter()

Component({
  properties: {
    completed: {
      type: Number,
      value: 0,
      observer(value) {
        this.setMapState(Number(value) || 0)
      }
    }
  },

  data: {
    center: MAP_CENTER,
    points: MAP_POINTS,
    markers: [],
    polyline: [{
      points: MAP_POINTS,
      color: '#f1694c',
      width: 7,
      borderColor: '#ffffff',
      borderWidth: 2,
      arrowLine: false,
      dottedLine: false,
      level: 'abovelabels'
    }]
  },

  lifetimes: {
    attached() {
      this.setMapState(this.properties.completed)
    }
  },

  methods: {
    setMapState(completed) {
      const safeCompleted = Math.max(0, Math.min(3, completed))
      this.setData({
        markers: routeData.getMapMarkers(safeCompleted)
      })
    },

    handleMarkerTap(event) {
      const id = Number(event.detail && event.detail.markerId)
      if (!id) return
      this.triggerEvent('stationtap', { index: id - 1 })
    },

    handleMapTap() {
      this.triggerEvent('maptap')
    }
  }
})
