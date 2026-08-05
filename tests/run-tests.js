const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const miniRoot = path.join(root, 'miniprogram')
const pages = ['route', 'action', 'upload', 'certificate', 'records', 'profile']
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

run('animated map keeps the UI route geometry and station order', () => {
  const source = fs.readFileSync(path.join(miniRoot, 'components', 'route-map', 'route-map.js'), 'utf8')
  assert.match(source, /\[194, 145\]/, 'start point')
  assert.match(source, /\[139, 56\]/, 'station 1')
  assert.match(source, /\[213, 72\]/, 'station 2')
  assert.match(source, /\[329, 193\]/, 'station 3')
  assert.match(source, /requestAnimationFrame/, 'animated route')
  assert.match(source, /lineDashOffset/, 'flowing dashed path')
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
  assert.equal(store.deriveStats({ completed: 3 }).distance, '1.02')
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

run('expired NFC check-ins cannot start an action', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  assert.equal(store.hasValidCheckIn({ checkins: { 0: { at: Date.now() - 21 * 60 * 1000 } } }, 0), false)
  assert.equal(store.hasValidCheckIn({ checkins: { 0: { at: Date.now() } } }, 0), true)
})

run('online NFC skip is an explicit temporary feature flag', () => {
  const config = require(path.join(miniRoot, 'utils', 'config.js'))
  const routeScript = fs.readFileSync(path.join(miniRoot, 'pages', 'route', 'route.js'), 'utf8')
  const routeTemplate = fs.readFileSync(path.join(miniRoot, 'pages', 'route', 'route.wxml'), 'utf8')
  assert.equal(config.allowNfcSkip, true)
  assert.match(routeScript, /enterCurrentStation\('nfc-skip'\)/)
  assert.match(routeTemplate, /暂时跳过 NFC（测试）/)
  assert.match(routeTemplate, /动作与照片上传仍需完成/)
})

run('production photo upload uses the configured CloudBase environment', () => {
  const config = require(path.join(miniRoot, 'utils', 'config.js'))
  const appScript = fs.readFileSync(path.join(miniRoot, 'app.js'), 'utf8')
  const photoScript = fs.readFileSync(path.join(miniRoot, 'utils', 'photo.js'), 'utf8')
  assert.equal(config.allowLocalPhotoFallback, true)
  assert.equal(config.cloudEnvId, 'cloudbase-d7gfg8vr06572506e')
  assert.match(appScript, /env: config\.cloudEnvId/)
  assert.match(photoScript, /config\.allowLocalPhotoFallback/)
  assert.match(photoScript, /CLOUD_ENV_NOT_CONFIGURED/)
})

run('photo completion reports cloud or local storage to the user', () => {
  const uploadScript = fs.readFileSync(path.join(miniRoot, 'pages', 'upload', 'upload.js'), 'utf8')
  const uploadTemplate = fs.readFileSync(path.join(miniRoot, 'pages', 'upload', 'upload.wxml'), 'utf8')
  assert.match(uploadScript, /savedPath\.startsWith\('local:\/\/'\)/)
  assert.match(uploadScript, /照片已保存到本机/)
  assert.match(uploadScript, /照片已保存至微信云端/)
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

console.log(`\n${pages.length} pages checked; native mini program structure is ready for DevTools.`)
