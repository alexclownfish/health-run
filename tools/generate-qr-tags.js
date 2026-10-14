const fs = require('node:fs/promises')
const path = require('node:path')
const QRCode = require('qrcode')
const { QR_TAGS, getQrInventoryStatus } = require('../miniprogram/utils/qr-tags')

const root = path.resolve(__dirname, '..')
const defaultOutputDir = path.join(root, 'assets', 'qr-checkpoints')
const defaultGuidePath = path.join(root, 'specs', '004-start-finish-qr-timing', 'qr-payloads.md')

function labelFor(tag) {
  if (tag.checkpointType === 'start') return '起点'
  if (tag.checkpointType === 'finish') return '终点'
  return `打卡点${tag.stationIndex + 1}`
}

async function generateQrTags({ outputDir = defaultOutputDir, guidePath = defaultGuidePath } = {}) {
  if (!getQrInventoryStatus().releaseReady) throw new Error('二维码清单无效，请先核对五个点位配置。')
  await fs.mkdir(outputDir, { recursive: true })
  const guide = [
    '# 二维码制作原文',
    '',
    '新版二维码包含两行：指定使用提示、原HRQ1数据。请选择“文本”类型，完整编码两行及它们之间的换行，不加入代码块标记或其他文字。',
    '',
    '文件由tools/generate-qr-tags.js生成，配置源为miniprogram/utils/qr-tags.js。运行npm run generate:qr-tags可重新生成五张PNG、五份文本及本文件。',
    '',
    '先更新并上传小程序体验版，再换印新版标牌。新版小程序同时支持旧单行码；旧体验版不支持带提示的新码。',
    '',
    '提示文字不限制其他软件解码，外部软件决定是否展示文本。二维码仍需在小程序内点击“扫码打卡”使用，不会自动打开小程序。',
    ''
  ]
  const files = []
  for (const tag of QR_TAGS) {
    const label = labelFor(tag)
    const imagePath = path.join(outputDir, `${label}.png`)
    const textPath = path.join(outputDir, `${label}.txt`)
    await QRCode.toFile(imagePath, tag.payload, {
      type: 'png', errorCorrectionLevel: 'M', scale: 12, margin: 4,
      color: { dark: '#000000ff', light: '#ffffffff' }
    })
    await fs.writeFile(textPath, tag.payload, 'utf8')
    guide.push(`## ${label}（${tag.pointCode}）`, '', '```text', tag.payload, '```', '')
    files.push({ pointCode: tag.pointCode, imagePath, textPath })
  }
  await fs.mkdir(path.dirname(guidePath), { recursive: true })
  await fs.writeFile(guidePath, guide.join('\n'), 'utf8')
  return files
}

if (require.main === module) {
  if (process.argv.length > 3) {
    console.error('用法：node tools/generate-qr-tags.js [图片和原文输出目录]')
    process.exitCode = 1
  } else {
    generateQrTags({ outputDir: process.argv[2] ? path.resolve(process.argv[2]) : defaultOutputDir })
      .then((files) => files.forEach((file) => console.log(`已生成 ${file.pointCode}：${file.imagePath}`)))
      .catch((error) => { console.error(error.message); process.exitCode = 1 })
  }
}

module.exports = { generateQrTags }
