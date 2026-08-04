const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const miniRoot = path.join(root, 'miniprogram')
const pages = ['route', 'action', 'upload', 'certificate', 'records', 'profile']

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
    ...fs.readdirSync(path.join(miniRoot, 'utils')).filter((file) => file.endsWith('.js')).map((file) => path.join(miniRoot, 'utils', file))
  ]
  for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
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

run('progress persistence prevents skipped stations', () => {
  const store = require(path.join(miniRoot, 'utils', 'progress.js'))
  const storage = {}
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value }
  }
  store.resetProgress()
  store.completeStation(1, 'photo-b.jpg')
  assert.equal(store.readProgress().completed, 0)
  assert.equal(store.readProgress().photos['1'], undefined)
  store.completeStation(0, 'photo-a.jpg')
  assert.equal(store.readProgress().completed, 1)
  store.completeStation(1, 'photo-b.jpg')
  assert.equal(store.readProgress().completed, 2)
  store.completeStation(2, 'photo-c.jpg')
  assert.equal(store.readProgress().completed, 3)
  assert.ok(store.readProgress().completedAt > 0)
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
  const files = [path.join(miniRoot, 'app.wxss'), ...pages.map((page) => path.join(miniRoot, 'pages', page, `${page}.wxss`))]
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
