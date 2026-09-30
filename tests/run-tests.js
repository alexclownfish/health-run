const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const miniRoot = path.join(root, 'miniprogram')
const pages = ['route', 'checkin', 'action', 'upload', 'certificate', 'records', 'profile']
const components = ['route-map', 'profile-auth']

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function run(label, callback) {
  try {
    callback()
    console.log(`PASS ${label}`)
  } catch (error) {
    console.error(`FAIL ${label}`)
    throw error
  }
}

run('project config points to miniprogram root', () => {
  const config = readJson(path.join(root, 'project.config.json'))
  assert.equal(config.miniprogramRoot, 'miniprogram/')
  assert.equal(config.compileType, 'miniprogram')
  assert.equal(config.appid, 'wx44b333d3d8cef506')
})

run('app page registry has every page asset', () => {
  const app = readJson(path.join(miniRoot, 'app.json'))
  assert.deepEqual(app.pages.map((page) => page.split('/')[1]), pages)
  for (const page of pages) {
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      assert.ok(fs.existsSync(path.join(miniRoot, 'pages', page, `${page}.${extension}`)), `${page}.${extension}`)
    }
  }
})

run('all app and page javascript parses', () => {
  const files = [
    path.join(miniRoot, 'app.js'),
    ...pages.map((page) => path.join(miniRoot, 'pages', page, `${page}.js`)),
    ...components.map((component) => path.join(miniRoot, 'components', component, `${component}.js`)),
    ...fs.readdirSync(path.join(miniRoot, 'utils')).filter((file) => file.endsWith('.js')).map((file) => path.join(miniRoot, 'utils', file))
  ]
  for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
})

run('route map and profile authorization components are registered', () => {
  for (const component of components) {
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      assert.ok(fs.existsSync(path.join(miniRoot, 'components', component, `${component}.${extension}`)), `${component}.${extension}`)
    }
    assert.equal(readJson(path.join(miniRoot, 'components', component, `${component}.json`)).component, true)
  }
  const route = readJson(path.join(miniRoot, 'pages', 'route', 'route.json'))
  const profile = readJson(path.join(miniRoot, 'pages', 'profile', 'profile.json'))
  assert.equal(route.usingComponents['route-map'], '/components/route-map/route-map')
  assert.equal(route.usingComponents['profile-auth'], '/components/profile-auth/profile-auth')
  assert.equal(profile.usingComponents['profile-auth'], '/components/profile-auth/profile-auth')
})

run('native map uses the GPX route and station marker order', () => {
  const source = fs.readFileSync(path.join(miniRoot, 'components', 'route-map', 'route-map.js'), 'utf8')
  const template = fs.readFileSync(path.join(miniRoot, 'components', 'route-map', 'route-map.wxml'), 'utf8')
  const route = require(path.join(miniRoot, 'utils', 'route.js'))
  assert.equal(route.TRACK[0][0], 0, 'GPX start index')
  assert.deepEqual(route.TASK_TRACK_INDEX, [135, 151, 159])
  assert.deepEqual(route.getTaskMarkers().map((marker) => marker.sourceLabel), ['0', '3', '4'])
  assert.equal(route.TRACK.length, 243, 'full GPX geometry')
  assert.equal(route.getMapPoints().length, 243, 'converted GPX geometry')
  assert.match(source, /getMapPoints/, 'GCJ-02 map points')
  assert.match(source, /getMapMarkers/, 'native map markers')
  assert.match(template, /<map/, 'native WeChat map')
  assert.match(template, /polyline="\{\{polyline\}\}"/, 'GPX polyline binding')
  assert.match(template, /show-location="\{\{false\}\}"/, 'location permission is disabled')
})

run('tab bar only points to existing pages', () => {
  const app = readJson(path.join(miniRoot, 'app.json'))
  for (const item of app.tabBar.list) assert.ok(app.pages.includes(item.pagePath))
})

run('progress state normalizes and caps safely', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  assert.equal(store.normalizeProgress({ completed: -3 }).completed, 0)
  assert.equal(store.normalizeProgress({ completed: 7 }).completed, 3)
  assert.equal(store.normalizeProgress({ completed: '2' }).completed, 2)
  assert.equal(store.deriveStats({ completed: 3 }).distance, '1.56')
  assert.equal(store.deriveStats({ completed: 1 }).points, 1)
})

run('strict station workflow rejects every skipped step', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  const storage = {}
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value }
  }
  store.resetProgress()
  store.checkInStation(1)
  store.startAction(0)
  store.completeStation(0, 'photo-a.jpg')
  assert.equal(store.readProgress().completed, 0)
  store.checkInStation(0)
  store.completeStation(0, 'photo-a.jpg')
  assert.equal(store.readProgress().completed, 0)
  store.startAction(0)
  store.completeStation(0, 'photo-a.jpg')
  assert.equal(store.readProgress().completed, 0)
  store.completeAction(0)
  store.completeStation(0, '')
  assert.equal(store.readProgress().completed, 0)
  store.completeStation(0, 'photo-a.jpg')
  assert.equal(store.readProgress().completed, 1)

  store.checkInStation(1)
  store.startAction(1)
  store.completeAction(1)
  store.completeStation(1, 'photo-b.jpg')
  assert.equal(store.readProgress().completed, 2)
  store.checkInStation(2)
  store.startAction(2)
  store.completeAction(2)
  store.completeStation(2, 'photo-c.jpg')
  assert.equal(store.readProgress().completed, 3)
  assert.ok(store.readProgress().completedAt > 0)
  assert.equal(store.readProgress().history.length, 3)
})

run('expired check-ins cannot start an action', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  assert.equal(store.hasValidCheckIn({ checkins: { 0: { at: Date.now() - 21 * 60 * 1000 } } }, 0), false)
  assert.equal(store.hasValidCheckIn({ checkins: { 0: { at: Date.now() } } }, 0), true)
})

run('production check-in entry is manual and has no local skip', () => {
  const config = require(path.join(miniRoot, 'utils', 'config.js'))
  const routeScript = fs.readFileSync(path.join(miniRoot, 'pages', 'route', 'route.js'), 'utf8')
  const routeTemplate = fs.readFileSync(path.join(miniRoot, 'pages', 'route', 'route.wxml'), 'utf8')
  assert.equal('allowNfcSkip' in config, false)
  assert.doesNotMatch(routeScript, /discoverOnce|checkInStation|nfc-skip/)
  assert.match(routeScript, /wx\.navigateTo\(\{ url: '\/pages\/checkin\/checkin' \}\)/)
  assert.doesNotMatch(routeTemplate, /跳过|自动打开|等待触碰现场标签|无需点击扫描/)
  assert.match(routeTemplate, /打开打卡页/)
})

run('packaged QR inventory is exact, unique, and non-URL', () => {
  const { QR_TAGS, getQrInventoryStatus } = require(path.join(miniRoot, 'utils', 'qr-tags.js'))
  assert.equal(QR_TAGS.length, 3)
  assert.equal(new Set(QR_TAGS.map((item) => item.qrId)).size, QR_TAGS.length)
  assert.equal(new Set(QR_TAGS.map((item) => item.qrToken)).size, QR_TAGS.length)
  for (const item of QR_TAGS) {
    assert.match(item.qrToken, /^[A-Za-z0-9_-]{22,64}$/)
    assert.equal(item.payloadVersion, 1)
    assert.doesNotMatch(item.payload, /^https?:/i)
  }
  assert.equal(getQrInventoryStatus().releaseReady, true)
})

run('QR validation requires exact HRQ1 inventory and current point', () => {
  const validation = require(path.join(miniRoot, 'utils', 'qr-validation.js'))
  const { QR_TAGS } = require(path.join(miniRoot, 'utils', 'qr-tags.js'))
  const accepted = validation.validateQrResult({ expectedStationIndex: 0, result: QR_TAGS[0].payload, qrTags: QR_TAGS, observedAt: 2 })
  assert.equal(accepted.ok, true)
  assert.equal(accepted.assurance, 'LOCAL_QR_MATCH')
  assert.equal(accepted.qrId, 'QR-001-A')
  assert.equal(validation.validateQrResult({ expectedStationIndex: 0, result: QR_TAGS[1].payload, qrTags: QR_TAGS }).reasonCode, 'WRONG_POINT')
  assert.equal(validation.validateQrResult({ expectedStationIndex: 0, result: 'https://example.com', qrTags: QR_TAGS }).reasonCode, 'QR_INVALID')
  assert.equal(validation.validateQrResult({ expectedStationIndex: 0, result: 'HRQ1|001|QR-001-A|unknown-token-value-1234', qrTags: QR_TAGS }).reasonCode, 'QR_UNKNOWN')
  assert.equal(validation.validateQrResult({ expectedStationIndex: 0, result: QR_TAGS[0].payload, qrTags: [QR_TAGS[0], { ...QR_TAGS[0], qrId: 'QR-DUP' }] }).reasonCode, 'QR_CONFIG_DUPLICATE')
  assert.equal(validation.normalizeScanError({ errMsg: 'scanCode:fail cancel' }).reasonCode, 'QR_CANCELLED')
  assert.equal(validation.normalizeScanError({ errMsg: 'scanCode:fail auth deny' }).reasonCode, 'CAMERA_DENIED')
  assert.equal(validation.normalizeScanError({ errMsg: 'scanCode:fail unavailable' }).reasonCode, 'QR_SCAN_FAILED')
})

run('validated QR metadata is local, minimized, ordered, and not overwritten', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  const storage = {}
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value }
  }
  store.resetProgress()
  store.checkInStation(1, 'qr-code', { qrId: 'FUTURE' })
  assert.equal(store.readProgress().checkins['1'], undefined)
  const qr = store.checkInStation(0, 'qr-code', {
    qrId: 'QR-001-A',
    pointCode: '001',
    assurance: 'LOCAL_QR_MATCH',
    qrToken: 'must-not-be-stored'
  })
  assert.equal(qr.checkins['0'].qrId, 'QR-001-A')
  assert.equal(qr.checkins['0'].assurance, 'LOCAL_QR_MATCH')
  assert.equal(JSON.stringify(qr).includes('must-not-be-stored'), false)
  assert.equal('tagId' in qr.checkins['0'], false)
  assert.equal('uidHint' in qr.checkins['0'], false)
})

run('a QR check-in repairs a legacy NFC-only local record', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  const storage = {}
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value }
  }
  store.saveProgress({
    completed: 0,
    startedAt: 1,
    checkins: { 0: { at: 2, source: 'nfc' } },
    actions: {},
    photos: {},
    history: [],
    routeId: 'route-01'
  })
  const repaired = store.checkInStation(0, 'qr-code', {
    qrId: 'QR-001-A',
    pointCode: '001',
    assurance: 'LOCAL_QR_MATCH'
  })
  assert.equal(repaired.checkins['0'].source, 'qr-code')
  assert.equal(repaired.checkins['0'].qrId, 'QR-001-A')
  assert.equal(repaired.checkins['0'].pointCode, '001')
})

run('check-in page exposes one platform-neutral QR action', () => {
  const script = fs.readFileSync(path.join(miniRoot, 'pages', 'checkin', 'checkin.js'), 'utf8')
  const template = fs.readFileSync(path.join(miniRoot, 'pages', 'checkin', 'checkin.wxml'), 'utf8')
  assert.match(script, /IDLE_QR/)
  assert.match(script, /startQrScan\(\)/)
  assert.match(script, /wx\.scanCode/)
  assert.match(script, /progress\.completed/)
  assert.doesNotMatch(script, /getNFCAdapter|startNfcScan|createDiscoverySession|resolvePlatformMode/)
  assert.match(script, /if \(!this\.pageActive \|\| this\.accepted/)
  assert.doesNotMatch(script, /resolveLaunchOptions|LOCAL_LINK_MATCH|LOCAL_LINK_COMPAT/)
  assert.match(template, /扫码打卡/)
  assert.doesNotMatch(template, /uidCanonical|tagToken|qrToken|raw UID/i)
  assert.match(template, /进度仅保存在当前设备/)
})

run('QR result survives the native scanner temporarily hiding the page', () => {
  const checkinPath = path.join(miniRoot, 'pages', 'checkin', 'checkin.js')
  const { QR_TAGS } = require(path.join(miniRoot, 'utils', 'qr-tags.js'))
  const storage = {}
  let pageDefinition
  let scanOptions
  global.Page = (definition) => { pageDefinition = definition }
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    scanCode: (options) => { scanOptions = options },
    vibrateShort: () => {},
    redirectTo: () => {}
  }
  delete require.cache[require.resolve(checkinPath)]
  require(checkinPath)
  delete global.Page

  const page = {
    ...pageDefinition,
    data: { ...pageDefinition.data },
    setData(update) {
      this.data = { ...this.data, ...update }
    },
    accepted: false,
    attemptId: 0,
    expectedStationIndex: 0,
    mode: 'QR',
    needsReset: false,
    pageActive: true,
    pageUnloaded: false,
    qrScanActive: false
  }

  page.startQrScan()
  page.onHide()
  assert.equal(page.attemptId, 1)
  assert.equal(page.qrScanActive, true)
  scanOptions.success({ result: QR_TAGS[0].payload })
  assert.equal(page.accepted, true)
  assert.equal(page.data.state, 'ACCEPTED')
  assert.equal(page.qrScanActive, false)
  clearTimeout(page.navigationTimer)
})

run('photo persistence remains completely local at runtime', () => {
  const appScript = fs.readFileSync(path.join(miniRoot, 'app.js'), 'utf8')
  const photoScript = fs.readFileSync(path.join(miniRoot, 'utils', 'photo.js'), 'utf8')
  assert.doesNotMatch(appScript, /wx\.cloud|cloudEnvId/)
  assert.doesNotMatch(photoScript, /wx\.cloud|uploadFile|cloudPath/)
  assert.match(photoScript, /wx\.saveFile/)
  assert.match(photoScript, /saveCheckInPhoto/)
  assert.doesNotMatch(photoScript, /local:\/\//)
})

run('photo completion reports device-local storage to the user', () => {
  const uploadScript = fs.readFileSync(path.join(miniRoot, 'pages', 'upload', 'upload.js'), 'utf8')
  const uploadTemplate = fs.readFileSync(path.join(miniRoot, 'pages', 'upload', 'upload.wxml'), 'utf8')
  assert.match(uploadScript, /照片已保存在当前设备/)
  assert.doesNotMatch(uploadScript, /云端|上传/)
  assert.match(uploadTemplate, /保存并完成点位/)
  assert.match(uploadTemplate, /\{\{storageNotice\}\}/)
})

run('completion certificate renders and saves a local album image', () => {
  const certificateScript = fs.readFileSync(path.join(miniRoot, 'pages', 'certificate', 'certificate.js'), 'utf8')
  const certificateTemplate = fs.readFileSync(path.join(miniRoot, 'pages', 'certificate', 'certificate.wxml'), 'utf8')
  assert.match(certificateScript, /canvasToTempFilePath/)
  assert.match(certificateScript, /saveImageToPhotosAlbum/)
  assert.match(certificateScript, /wx\.openSetting/)
  assert.match(certificateTemplate, /id="certificateCanvas"/)
  assert.match(certificateTemplate, /savingCertificate/)
})

run('user profile storage normalizes WeChat data', () => {
  const userStore = require(path.join(miniRoot, 'utils', 'user.js'))
  const user = userStore.saveUser({ nickName: '  小跑  ', avatarUrl: 'wxfile://avatar.png' })
  assert.equal(user.nickName, '小跑')
  assert.equal(userStore.readUser().avatarUrl, 'wxfile://avatar.png')
  assert.equal(userStore.isProfileComplete(user), true)
  assert.equal(userStore.isProfileComplete({ nickName: '小跑', avatarUrl: '' }), false)
})

run('calendar uses real month boundaries and activity dates', () => {
  const format = require(path.join(miniRoot, 'utils', 'format.js'))
  const calendar = format.getMonthGrid(2026, 7, ['2026-08-05'])
  assert.equal(calendar.monthLabel, '2026.08')
  assert.equal(calendar.cells.find((cell) => cell.day === 5).active, true)
  assert.equal(calendar.cells.length % 7, 0)
})

run('wxml has balanced view/block tags', () => {
  for (const page of pages) {
    const wxml = fs.readFileSync(path.join(miniRoot, 'pages', page, `${page}.wxml`), 'utf8')
    const tags = [...wxml.matchAll(/<\/?(view|text|button|image|block)(?:\s[^>]*)?>/g)].map((match) => match[0])
    const stack = []
    for (const tag of tags) {
      if (tag.startsWith('</')) {
        assert.equal(stack.pop(), tag.match(/^<\/(\w+)/)[1], `${page} closing tag`)
      } else if (!tag.endsWith('/>')) {
        stack.push(tag.match(/^<(\w+)/)[1])
      }
    }
    assert.equal(stack.length, 0, `${page} unclosed tags`)
  }
})

run('wxml event handlers exist in page scripts', () => {
  for (const page of pages) {
    const wxml = fs.readFileSync(path.join(miniRoot, 'pages', page, `${page}.wxml`), 'utf8')
    const script = fs.readFileSync(path.join(miniRoot, 'pages', page, `${page}.js`), 'utf8')
    const handlers = [...wxml.matchAll(/(?:bind|catch)[a-z]+="([A-Za-z0-9_]+)"/g)].map((match) => match[1])
    for (const handler of handlers) {
      assert.match(script, new RegExp(`\\b${handler}\\s*\\(`), `${page}.${handler}`)
    }
  }
})

run('wxss files have balanced braces', () => {
  const files = [
    path.join(miniRoot, 'app.wxss'),
    ...pages.map((page) => path.join(miniRoot, 'pages', page, `${page}.wxss`)),
    ...components.map((component) => path.join(miniRoot, 'components', component, `${component}.wxss`))
  ]
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    let depth = 0
    for (const character of source) {
      if (character === '{') depth += 1
      if (character === '}') depth -= 1
      assert.ok(depth >= 0, `${path.basename(file)} closes too many blocks`)
    }
    assert.equal(depth, 0, `${path.basename(file)} has unclosed blocks`)
  }
})

run('warm orange and indigo theme has no legacy green tokens', () => {
  const requiredTokens = ['--ink', '--deep', '--primary', '--orange', '--orange-bright', '--yellow', '--coral', '--lavender', '--peach', '--paper', '--line', '--muted', '--disabled']
  const appStyles = fs.readFileSync(path.join(miniRoot, 'app.wxss'), 'utf8')
  for (const token of requiredTokens) assert.match(appStyles, new RegExp(`${token}:`), token)

  const sourceFiles = [
    path.join(miniRoot, 'app.wxss'),
    path.join(miniRoot, 'app.json'),
    ...pages.map((page) => path.join(miniRoot, 'pages', page, `${page}.wxss`)),
    ...pages.map((page) => path.join(miniRoot, 'pages', page, `${page}.json`)),
    ...components.map((component) => path.join(miniRoot, 'components', component, `${component}.wxss`)),
    path.join(miniRoot, 'components', 'route-map', 'route-map.js'),
    path.join(miniRoot, 'utils', 'route.js'),
    path.join(miniRoot, 'pages', 'certificate', 'certificate.js'),
    path.join(miniRoot, 'pages', 'profile', 'profile.js'),
    path.join(miniRoot, 'pages', 'upload', 'upload.js')
  ]
  const legacyColors = /#(?:102d25|005d46|087d5c|a8ee24|e5f8c7|d9f2e7|f4f7f2|d7e2db|6c7e76|55c7dd|f1694c|edf6f1|e4ebe7|e7f4ec|e4f3ec|8bdcc6|48c4aa|9fc9b6|c5f4db|c2ded3|b1d0c4|c7eadd|85978f)\b/i
  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /var\(--(?:green|mint|lime|blue|cream)\)/i, path.relative(root, file))
    assert.doesNotMatch(source, legacyColors, path.relative(root, file))
  }
})

async function runAsync(label, callback) {
  try {
    await callback()
    console.log(`PASS ${label}`)
  } catch (error) {
    console.error(`FAIL ${label}`)
    throw error
  }
}

async function runAsyncTests() {
  console.log(`\n${pages.length} pages checked; native mini program structure is ready for DevTools.`)
}

runAsyncTests().catch((error) => {
  process.exitCode = 1
  setImmediate(() => { throw error })
})
