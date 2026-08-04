function getEnvVersion() {
  if (typeof wx.getAccountInfoSync !== 'function') return 'release'
  const account = wx.getAccountInfoSync()
  return account && account.miniProgram ? account.miniProgram.envVersion : 'release'
}

function saveLocal(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveFile({
      tempFilePath: filePath,
      success: (result) => resolve(`local://${result.savedFilePath || filePath}`),
      fail: reject
    })
  })
}

function uploadCheckInPhoto(filePath, stationIndex) {
  if (!filePath) return Promise.reject(new Error('PHOTO_REQUIRED'))
  const extension = filePath.includes('.') ? filePath.split('.').pop().toLowerCase() : 'jpg'
  const cloudPath = `health-run/route-01/station-${Number(stationIndex) + 1}/${Date.now()}.${extension}`
  if (wx.cloud && typeof wx.cloud.uploadFile === 'function') {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (result) => {
          if (result.fileID) resolve(result.fileID)
          else reject(new Error('CLOUD_FILE_ID_MISSING'))
        },
        fail: (error) => {
          if (getEnvVersion() === 'develop') saveLocal(filePath).then(resolve).catch(reject)
          else reject(error)
        }
      })
    })
  }
  if (getEnvVersion() === 'develop') return saveLocal(filePath)
  return Promise.reject(new Error('CLOUD_UNAVAILABLE'))
}

module.exports = { getEnvVersion, saveLocal, uploadCheckInPhoto }
