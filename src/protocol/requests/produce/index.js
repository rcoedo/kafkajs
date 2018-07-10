const versions = {
  0: ({ acks, timeout, topicData }) => {
    const request = require('./v0/request')
    const response = require('./v0/response')
    return { request: request({ acks, timeout, topicData }), response }
  },
  1: ({ acks, timeout, topicData }) => {
    const request = require('./v1/request')
    const response = require('./v1/response')
    return { request: request({ acks, timeout, topicData }), response }
  },
  2: ({ acks, timeout, topicData, compression }) => {
    const request = require('./v2/request')
    const response = require('./v2/response')
    return { request: request({ acks, timeout, compression, topicData }), response }
  },
  3: ({ transactionalId = null, acks, timeout, compression, topicData }) => {
    const request = require('./v3/request')
    const response = require('./v3/response')
    return {
      request: request({ transactionalId, acks, timeout, compression, topicData }),
      response,
    }
  },
}

module.exports = {
  versions: Object.keys(versions),
  protocol: ({ version }) => versions[version],
}
