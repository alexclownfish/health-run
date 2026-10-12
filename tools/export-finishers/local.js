const fs = require('node:fs/promises')
const path = require('node:path')
const { checkConfig, validStoredRecord } = require('../../cloudfunctions/submitCompletion/policy')

function invalid(code) {
  return Object.assign(new Error(code), { code })
}

function parseRecords(text) {
  const source = text.replace(/^\uFEFF/, '').trim()
  if (!source) return []
  let value
  try { value = JSON.parse(source) } catch (error) {
    if (source.startsWith('[')) throw invalid('LOCAL_JSON_INVALID')
    // Cloud console exports commonly store one complete JSON document per line.
    value = source.split(/\r?\n/).flatMap((line, index) => {
      if (!line.trim()) return []
      try { return [JSON.parse(line)] } catch (parseError) {
        throw invalid(`LOCAL_JSON_LINE_${index + 1}`)
      }
    })
  }
  if (value && !Array.isArray(value) && typeof value === 'object' && Object.hasOwn(value, 'data')) {
    if (!Array.isArray(value.data)) throw invalid('LOCAL_JSON_INVALID')
    value = value.data
  }
  const records = Array.isArray(value) ? value : [value]
  if (!records.every((record) => record && typeof record === 'object' && !Array.isArray(record))) {
    throw invalid('LOCAL_JSON_INVALID')
  }
  return records
}

async function readRecords(filename) {
  if (!['.json', '.jsonl', '.ndjson'].includes(path.extname(filename).toLowerCase())) {
    throw invalid('LOCAL_FILE_FORMAT')
  }
  if ((await fs.stat(filename)).size > 50 * 1024 * 1024) throw invalid('LOCAL_FILE_TOO_LARGE')
  return parseRecords(await fs.readFile(filename, 'utf8'))
}

function collectLocalRows(records, config, cutoff) {
  if (!checkConfig(config).ok || !Number.isSafeInteger(cutoff) || cutoff <= 0) throw invalid('INVALID_EXPORT_CONFIG')
  const rows = []
  const seen = new Set()
  let excluded = 0
  // Prefer the earliest valid reception if the local input accidentally repeats a record.
  const ordered = records.slice().sort((left, right) => left.receivedAt - right.receivedAt)
  for (const record of ordered) {
    if (!validStoredRecord(record, config, cutoff) || seen.has(record.ownerOpenId)) {
      excluded += 1
      continue
    }
    seen.add(record.ownerOpenId)
    rows.push(record)
  }
  rows.sort((left, right) => left.completedAt - right.completedAt || left._id.localeCompare(right._id))
  return { rows, examined: records.length, excluded }
}

module.exports = { parseRecords, readRecords, collectLocalRows }
