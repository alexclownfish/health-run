const QR_PATTERN = /^HRQ(\d+)\|(\d{3})\|(QR-[A-Z0-9-]{1,24})\|([A-Za-z0-9_-]{22,64})$/

const ASSURANCE = {
  QR: 'LOCAL_QR_MATCH'
}

function rejected(reasonCode, retryable = false) {
  return { ok: false, reasonCode, retryable }
}

function readScanResult(value) {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value.result === 'string') return value.result.trim()
  return ''
}

function parseQrPayload(value) {
  const raw = readScanResult(value)
  const match = QR_PATTERN.exec(raw)
  if (!match) return rejected('QR_INVALID', true)
  const payloadVersion = Number(match[1])
  if (payloadVersion !== 1) return rejected('QR_INVALID')
  return {
    ok: true,
    raw,
    payloadVersion,
    pointCode: match[2],
    qrId: match[3],
    qrToken: match[4]
  }
}

function validateQrResult({ expectedStationIndex, expectedCheckpointType, result, qrTags, observedAt = Date.now() }) {
  const checkpointType = expectedCheckpointType || 'station'
  if (checkpointType === 'station' && (!Number.isInteger(expectedStationIndex) || expectedStationIndex < 0)) {
    return rejected('NO_CURRENT_STATION')
  }
  if (!['start', 'station', 'finish'].includes(checkpointType)) return rejected('NO_CURRENT_CHECKPOINT')
  const parsed = parseQrPayload(result)
  if (!parsed.ok) return parsed
  const matches = (Array.isArray(qrTags) ? qrTags : []).filter((item) => (
    item && item.enabled !== false && item.payload === parsed.raw
  ))
  if (!matches.length) return rejected('QR_UNKNOWN')
  if (matches.length !== 1) return rejected('QR_CONFIG_DUPLICATE')
  const item = matches[0]
  if (item.checkpointType !== checkpointType) return rejected('WRONG_POINT')
  if (checkpointType === 'station' && item.stationIndex !== expectedStationIndex) return rejected('WRONG_POINT')
  return {
    ok: true,
    qrId: item.qrId,
    pointCode: item.pointCode,
    checkpointType: item.checkpointType,
    checkpointIndex: item.checkpointIndex,
    stationIndex: item.stationIndex,
    assurance: ASSURANCE.QR,
    observedAt
  }
}

function normalizeScanError(error) {
  const text = `${error && error.errMsg ? error.errMsg : ''} ${error && error.message ? error.message : ''}`.toLowerCase()
  if (/cancel/.test(text)) return rejected('QR_CANCELLED', true)
  if (/auth|authorize|permission|denied/.test(text)) return rejected('CAMERA_DENIED', true)
  return rejected('QR_SCAN_FAILED', true)
}

module.exports = {
  ASSURANCE,
  QR_PATTERN,
  parseQrPayload,
  validateQrResult,
  normalizeScanError
}
