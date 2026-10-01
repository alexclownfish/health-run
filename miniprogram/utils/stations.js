const stations = [
  {
    id: 1,
    title: '肩颈舒展',
    location: '轨迹标注点 0',
    distance: '约 830 m',
    sourceMarker: '0',
    tag: '舒展',
    motion: '抬头看天 · 肩胛骨后夹',
    heading: '打开胸腔，深呼吸',
    instruction: '双脚站稳，手臂自然抬起，肩胛骨向后轻夹，感受胸前舒展。',
    duration: 10,
    safety: '动作缓慢、不憋气；如有明显不适，请立即停止。',
    success: '肩颈已经醒来，继续沿路线前往下一站。'
  },
  {
    id: 2,
    title: '手腕放松',
    location: '轨迹标注点 3',
    distance: '约 920 m',
    sourceMarker: '3',
    tag: '放松',
    motion: '手臂前伸 · 掌心向外',
    heading: '伸展手腕，放松指尖',
    instruction: '手臂与地面平行，另一只手轻压指尖，左右各保持 5 秒。',
    duration: 10,
    safety: '保持手肘微屈，不要用力拉扯腕关节。',
    success: '手腕得到放松，还剩最后一个活力点位。'
  },
  {
    id: 3,
    title: '腰背激活',
    location: '轨迹标注点 4',
    distance: '约 1.02 km',
    sourceMarker: '4',
    tag: '激活',
    motion: '双手扶髋 · 身体侧屈',
    heading: '唤醒腰背，找回支撑',
    instruction: '双脚与肩同宽，核心微收，身体缓慢向左右侧屈，不要前倾。',
    duration: 12,
    safety: '保持呼吸自然，动作范围以腰背舒适为准。',
    success: '点位已完成，完成三个任务点后请前往终点扫码。'
  }
]

module.exports = stations
