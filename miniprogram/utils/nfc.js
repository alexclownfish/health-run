function isSupported() {
  return typeof wx !== 'undefined' && typeof wx.getNFCAdapter === 'function'
}

function discoverOnce(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (!isSupported()) {
      reject(new Error('NFC_UNSUPPORTED'))
      return
    }

    const adapter = wx.getNFCAdapter()
    let settled = false
    let timer = null

    const finish = (callback, value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      try {
        adapter.offDiscovered(onDiscovered)
        adapter.stopDiscovery()
      } catch (error) {}
      callback(value)
    }

    const onDiscovered = (result) => finish(resolve, result || {})

    adapter.onDiscovered(onDiscovered)
    adapter.startDiscovery({
      success: () => {
        timer = setTimeout(() => finish(reject, new Error('NFC_TIMEOUT')), timeout)
      },
      fail: (error) => finish(reject, error || new Error('NFC_START_FAILED'))
    })
  })
}

module.exports = { isSupported, discoverOnce }
