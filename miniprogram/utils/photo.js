function saveLocal(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveFile({
      tempFilePath: filePath,
      success: (result) => resolve(result.savedFilePath || filePath),
      fail: reject
    })
  })
}

function getErrorCode(error) {
  if (!error) return 'UNKNOWN'
  if (typeof error.errCode !== 'undefined') return String(error.errCode)
  const message = error.errMsg || error.message || ''
  const match = String(message).match(/(?:errCode|code)[:=\s]+(-?\d+)/i)
  return match ? match[1] : 'UNKNOWN'
}

function withUploadContext(error) {
  const wrapped = new Error(error && (error.errMsg || error.message) || 'PHOTO_UPLOAD_FAILED')
  wrapped.code = getErrorCode(error)
  return wrapped
}

function saveCheckInPhoto(filePath) {
  if (!filePath) return Promise.reject(new Error('PHOTO_REQUIRED'))
  return saveLocal(filePath).catch((error) => Promise.reject(withUploadContext(error)))
}

module.exports = { getErrorCode, saveLocal, saveCheckInPhoto }
