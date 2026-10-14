const routeData = require('./route')

function distanceLabel(index) {
  const km = routeData.TASK_DISTANCE_KM[index]
  return km < 1 ? `约 ${Math.round(km * 1000 / 10) * 10} m` : `约 ${km.toFixed(2)} km`
}

const stations = [
  {
    id: 1,
    title: '肩颈舒展',
    location: routeData.CHECKPOINTS[0].name,
    distance: distanceLabel(0),
    sourceMarker: '1',
    tag: '舒展',
    motion: '头部向右、向左侧倾拉伸',
    heading: '舒展肩颈，放松头部',
    instruction: '自然站立，头部向右侧倾拉伸，再向左侧倾拉伸。动作缓慢，保持呼吸自然。',
    duration: 10,
    safety: '动作缓慢、不憋气；如有明显不适，请立即停止。',
    success: '肩颈已经醒来，继续沿路线前往下一站。'
  },
  {
    id: 2,
    title: '手腕放松',
    location: routeData.CHECKPOINTS[1].name,
    distance: distanceLabel(1),
    sourceMarker: '2',
    tag: '放松',
    motion: '手腕向下、向上伸展',
    heading: '伸展手腕，放松指尖',
    instruction: '手臂向前伸，掌心向外；手腕向下轻轻压，再向上轻轻拉。',
    duration: 10,
    safety: '保持手肘微屈，不要用力拉扯腕关节。',
    success: '手腕得到放松，还剩最后一个活力点位。'
  },
  {
    id: 3,
    title: '腰背激活',
    location: routeData.CHECKPOINTS[2].name,
    distance: distanceLabel(2),
    sourceMarker: '3',
    tag: '激活',
    motion: '挺胸后仰 · 低头含胸',
    heading: '舒展胸腰，放松背部',
    instruction: '自然站立，挺胸后仰激活胸腰，再低头含胸放松背部。',
    duration: 12,
    safety: '保持呼吸自然，动作范围以腰背舒适为准。',
    success: '点位已完成，完成三个任务点后请前往终点扫码。'
  }
]

module.exports = stations
