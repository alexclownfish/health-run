const config = require('./config')

function saveLocal(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveFile({
      tempFilePath: filePath,
      success: (result) => resolve(`local://${result.savedFilePath || filePath}`),
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

function uploadCheckInPhoto(filePath, stationIndex) {
  if (!filePath) return Promise.reject(new Error('PHOTO_REQUIRED'))
  const extension = filePath.includes('.') ? filePath.split('.').pop().toLowerCase() : 'jpg'
  const cloudPath = `health-run/route-01/station-${Number(stationIndex) + 1}/${Date.now()}.${extension}`
  if (config.cloudEnvId && wx.cloud && typeof wx.cloud.uploadFile === 'function') {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        config: { env: config.cloudEnvId },
        cloudPath,
        filePath,
        success: (result) => {
          if (result.fileID) resolve(result.fileID)
          else reject(new Error('CLOUD_FILE_ID_MISSING'))
        },
        fail: (error) => {
          if (config.allowLocalPhotoFallback) saveLocal(filePath).then(resolve).catch((localError) => reject(withUploadContext(localError)))
          else reject(withUploadContext(error))
        }
      })
    })
  }
  if (config.allowLocalPhotoFallback) return saveLocal(filePath)
  return Promise.reject(withUploadContext(new Error('CLOUD_ENV_NOT_CONFIGURED')))
}

module.exports = { getErrorCode, saveLocal, uploadCheckInPhoto }
