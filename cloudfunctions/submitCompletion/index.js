const cloud = require('wx-server-sdk')
const { submit } = require('./service')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  let config
  try { config = JSON.parse(process.env.ACTIVITY_CONFIG || '{}') } catch (error) {
    console.error('[submitCompletion] invalid ACTIVITY_CONFIG')
    return { ok: false, reasonCode: 'CONFIG_INVALID' }
  }
  const db = cloud.database()
  const repository = {
    create: (collection, record) => db.collection(collection).add({ data: record }),
    async find(collection, id) {
      const result = await db.collection(collection).doc(id).get()
      return Array.isArray(result.data) ? result.data[0] : result.data
    }
  }
  const result = await submit(event, cloud.getWXContext(), config, repository)
  console.info('[submitCompletion] result', {
    ok: result && result.ok === true,
    status: result && result.status || '',
    reasonCode: result && result.reasonCode || ''
  })
  return result
}
