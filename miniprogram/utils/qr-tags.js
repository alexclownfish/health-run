const QR_TAGS = [
  {
    qrId: 'QR-001-A',
    qrToken: 'ced81f9f7eb9a66ad9e5bcd07d732613',
    pointCode: '001',
    stationIndex: 0,
    payloadVersion: 1,
    enabled: true
  },
  {
    qrId: 'QR-002-A',
    qrToken: '6a75420f4b73f6b13b73679a280c0a2e',
    pointCode: '002',
    stationIndex: 1,
    payloadVersion: 1,
    enabled: true
  },
  {
    qrId: 'QR-003-A',
    qrToken: 'f8f3d159740d3cf8104f3aa5618302e6',
    pointCode: '003',
    stationIndex: 2,
    payloadVersion: 1,
    enabled: true
  }
].map((item) => ({
  ...item,
  payload: `HRQ${item.payloadVersion}|${item.pointCode}|${item.qrId}|${item.qrToken}`
}))

function hasDuplicates(values) {
  return new Set(values).size !== values.length
}

function getQrInventoryStatus(qrTags = QR_TAGS) {
  const enabled = (Array.isArray(qrTags) ? qrTags : []).filter((item) => item && item.enabled !== false)
  const invalid = enabled.filter((item) => (
    !/^\d{3}$/.test(item.pointCode) ||
    !/^QR-[A-Z0-9-]{1,24}$/.test(item.qrId) ||
    !/^[A-Za-z0-9_-]{22,64}$/.test(item.qrToken) ||
    item.payloadVersion !== 1 ||
    item.payload !== `HRQ1|${item.pointCode}|${item.qrId}|${item.qrToken}` ||
    !Number.isInteger(item.stationIndex)
  ))
  return {
    releaseReady: enabled.length > 0 &&
      invalid.length === 0 &&
      !hasDuplicates(enabled.map((item) => item.qrId)) &&
      !hasDuplicates(enabled.map((item) => item.qrToken)) &&
      !hasDuplicates(enabled.map((item) => item.payload)),
    invalidQrIds: invalid.map((item) => item.qrId)
  }
}

module.exports = {
  QR_TAGS,
  getQrInventoryStatus
}
