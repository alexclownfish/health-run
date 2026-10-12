const { prepareRecord, validStoredRecord } = require('./policy')

function receipt(record, status) {
  return {
    ok: true,
    status,
    recordId: record._id,
    participantId: record.participantId,
    receivedAt: record.receivedAt
  }
}

async function submit(payload, context, config, repository, now = Date.now()) {
  const prepared = prepareRecord(payload, context, config, now)
  if (!prepared.ok) return prepared
  const { collection, record } = prepared
  try {
    await repository.create(collection, record)
    return receipt(record, 'accepted')
  } catch (error) {
    // A deterministic _id makes concurrent inserts atomic; never overwrite a finish.
    try {
      const existing = await repository.find(collection, record._id)
      if (existing && existing.ownerOpenId === record.ownerOpenId &&
        existing.activityId === record.activityId && existing.environmentId === record.environmentId &&
        validStoredRecord(existing, config, now)) {
        return receipt(existing, 'alreadyAccepted')
      }
    } catch (readError) { /* Return a retryable error without leaking SDK details. */ }
    return { ok: false, reasonCode: 'SERVICE_UNAVAILABLE' }
  }
}

module.exports = { submit }
