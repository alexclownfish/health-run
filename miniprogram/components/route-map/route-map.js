const VIEW_WIDTH = 360
const VIEW_HEIGHT = 240

const ROUTE = [
  [194, 145],
  [154, 116],
  [108, 85],
  [139, 56],
  [145, 19],
  [178, 28],
  [213, 72],
  [206, 121],
  [241, 139],
  [307, 153],
  [329, 193],
  [317, 229],
  [253, 213],
  [215, 175],
  [194, 145]
]

const MARKERS = [
  { label: 'S', x: 194, y: 145, start: true },
  { label: '1', x: 139, y: 56 },
  { label: '2', x: 213, y: 72 },
  { label: '3', x: 329, y: 193 }
]

Component({
  properties: {
    completed: {
      type: Number,
      value: 0,
      observer() {
        this.drawFrame(this.data.dashOffset || 0)
      }
    }
  },

  data: {
    dashOffset: 0
  },

  lifetimes: {
    ready() {
      this.initCanvas()
    },
    detached() {
      this.stopAnimation()
    }
  },

  pageLifetimes: {
    show() {
      this.startAnimation()
    },
    hide() {
      this.stopAnimation()
    }
  },

  methods: {
    initCanvas() {
      wx.createSelectorQuery()
        .in(this)
        .select('#routeMapCanvas')
        .fields({ node: true, size: true })
        .exec((result) => {
          const target = result && result[0]
          if (!target || !target.node || !target.width || !target.height) return
          const canvas = target.node
          const context = canvas.getContext('2d')
          const system = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync()
          const pixelRatio = Math.min(system.pixelRatio || 1, 3)
          canvas.width = target.width * pixelRatio
          canvas.height = target.height * pixelRatio
          context.scale(pixelRatio, pixelRatio)
          this.canvas = canvas
          this.context = context
          this.canvasWidth = target.width
          this.canvasHeight = target.height
          this.startAnimation()
        })
    },

    startAnimation() {
      if (!this.canvas || this.animationFrame) return
      const tick = () => {
        const nextOffset = ((this.data.dashOffset || 0) - 0.45) % 18
        this.data.dashOffset = nextOffset
        this.drawFrame(nextOffset)
        this.animationFrame = this.canvas.requestAnimationFrame(tick)
      }
      tick()
    },

    stopAnimation() {
      if (!this.canvas || !this.animationFrame) return
      this.canvas.cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    },

    drawFrame(dashOffset) {
      const context = this.context
      if (!context) return
      const scaleX = this.canvasWidth / VIEW_WIDTH
      const scaleY = this.canvasHeight / VIEW_HEIGHT
      context.save()
      context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      context.scale(scaleX, scaleY)
      this.drawBaseMap(context)
      this.drawRoute(context, dashOffset / scaleX)
      this.drawMarkers(context)
      context.restore()
    },

    drawBaseMap(context) {
      context.fillStyle = '#e8eee9'
      context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)

      context.fillStyle = '#bfe5c7'
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(151, 0)
      context.bezierCurveTo(136, 47, 123, 79, 91, 115)
      context.bezierCurveTo(59, 148, 34, 181, 0, 196)
      context.closePath()
      context.fill()

      context.fillStyle = '#91d8ec'
      context.beginPath()
      context.moveTo(0, 157)
      context.bezierCurveTo(54, 139, 63, 91, 111, 91)
      context.bezierCurveTo(146, 91, 159, 121, 141, 153)
      context.bezierCurveTo(118, 194, 66, 214, 0, 230)
      context.closePath()
      context.fill()

      context.strokeStyle = 'rgba(255,255,255,.95)'
      context.lineCap = 'round'
      context.lineWidth = 4
      this.strokePath(context, [[4, 31], [74, 38], [128, 32], [180, 19]])
      this.strokePath(context, [[25, 3], [31, 67], [30, 129], [25, 183]])
      this.strokePath(context, [[67, 0], [65, 43], [75, 78], [94, 110]])
      this.strokePath(context, [[0, 115], [61, 113], [103, 99], [147, 79]])
      this.strokePath(context, [[0, 201], [58, 184], [107, 159], [150, 128]])

      context.strokeStyle = '#ffffff'
      context.lineWidth = 7
      this.strokePath(context, [[116, -6], [144, 47], [199, 62], [247, 50], [304, 68], [364, 87]])
      this.strokePath(context, [[161, -5], [176, 43], [179, 91], [197, 135], [225, 177], [251, 242]])
      this.strokePath(context, [[94, 171], [149, 168], [199, 155], [252, 143], [316, 144], [365, 153]])
      this.strokePath(context, [[111, 225], [164, 215], [214, 213], [272, 220], [327, 232]])

      context.setLineDash([3, 4])
      context.strokeStyle = '#c8d2cd'
      context.lineWidth = 1.4
      this.strokePath(context, [[97, 134], [153, 128], [214, 113], [271, 104], [342, 118]])
      context.setLineDash([])

      const buildings = [
        [[171, 7], [206, 10], [203, 39], [174, 35]],
        [[224, 14], [260, 23], [252, 54], [215, 45]],
        [[277, 26], [319, 39], [310, 73], [270, 61]],
        [[229, 84], [267, 91], [258, 127], [221, 117]],
        [[276, 79], [321, 89], [312, 125], [269, 117]],
        [[152, 137], [184, 142], [180, 173], [145, 166]],
        [[239, 149], [280, 157], [272, 190], [232, 182]],
        [[285, 153], [324, 163], [316, 193], [280, 184]],
        [[162, 190], [207, 198], [200, 228], [154, 219]]
      ]
      buildings.forEach((points, index) => {
        context.fillStyle = index % 2 ? '#cfd7d3' : '#d7ddda'
        context.strokeStyle = 'rgba(255,255,255,.82)'
        context.lineWidth = 2
        context.beginPath()
        points.forEach((point, pointIndex) => pointIndex ? context.lineTo(point[0], point[1]) : context.moveTo(point[0], point[1]))
        context.closePath()
        context.fill()
        context.stroke()
      })

      context.fillStyle = '#f3a979'
      context.fillRect(349, 0, 11, VIEW_HEIGHT)
      context.fillStyle = 'rgba(255,255,255,.75)'
      context.fillRect(351, 0, 2, VIEW_HEIGHT)

      this.drawLabel(context, '公司绿地', 18, 201)
      this.drawLabel(context, '公司大楼', 172, 14)
      this.drawLabel(context, '公共休息区', 145, 183)
      this.drawLabel(context, '公司园区', 188, 232)
      this.drawLabel(context, '溪畔绿道', 20, 148)
    },

    drawRoute(context, dashOffset) {
      context.lineJoin = 'round'
      context.lineCap = 'round'
      context.strokeStyle = 'rgba(255,255,255,.96)'
      context.lineWidth = 10
      this.strokePath(context, ROUTE)
      context.setLineDash([9, 7])
      context.lineDashOffset = dashOffset
      context.strokeStyle = '#f1694c'
      context.lineWidth = 5
      this.strokePath(context, ROUTE)
      context.setLineDash([])
      context.lineDashOffset = 0
    },

    drawMarkers(context) {
      const completed = Math.max(0, Math.min(3, Number(this.data.completed) || 0))
      MARKERS.forEach((marker, index) => {
        const stationIndex = index - 1
        const done = stationIndex >= 0 && stationIndex < completed
        const current = stationIndex === completed && completed < 3
        const fill = marker.start || done ? '#005d46' : current ? '#a8ee24' : '#ffffff'
        const textColor = marker.start || done ? '#ffffff' : '#102d25'
        if (current) {
          context.beginPath()
          context.arc(marker.x, marker.y, 18, 0, Math.PI * 2)
          context.fillStyle = 'rgba(168,238,36,.28)'
          context.fill()
        }
        context.beginPath()
        context.arc(marker.x, marker.y, 13, 0, Math.PI * 2)
        context.fillStyle = fill
        context.shadowColor = 'rgba(0,70,50,.22)'
        context.shadowBlur = 7
        context.shadowOffsetY = 3
        context.fill()
        context.shadowColor = 'transparent'
        context.lineWidth = 2.5
        context.strokeStyle = '#ffffff'
        context.stroke()
        context.fillStyle = textColor
        context.font = '700 11px sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(done ? '✓' : marker.label, marker.x, marker.y + 0.5)
      })
    },

    drawLabel(context, label, x, y) {
      context.fillStyle = '#5f796f'
      context.font = '600 7px sans-serif'
      context.textAlign = 'left'
      context.textBaseline = 'alphabetic'
      context.fillText(label, x, y)
    },

    strokePath(context, points) {
      context.beginPath()
      points.forEach((point, index) => index ? context.lineTo(point[0], point[1]) : context.moveTo(point[0], point[1]))
      context.stroke()
    }
  }
})
