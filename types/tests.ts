import * as fs from 'fs'

import { Kafka, PartitionAssigners, logLevel, CompressionTypes, CompressionCodecs } from './index'

const { roundRobin } = PartitionAssigners

// COMMON
const host = 'localhost'
const topic = 'topic-test'

const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: [`${host}:9094`, `${host}:9097`, `${host}:9100`],
  clientId: 'example-consumer',
  ssl: {
    ca: [fs.readFileSync('./testHelpers/certs/cert-signed', 'utf-8')],
  },
  sasl: {
    mechanism: 'plain',
    username: 'test',
    password: 'testtest',
  },
})

// CONSUMER
const consumer = kafka.consumer({ groupId: 'test-group' })

const runConsumer = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic })
  await consumer.run({
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      uncommittedOffsets,
      isRunning,
      isStale,
    }) => {
      resolveOffset('123')
      await heartbeat()
      commitOffsetsIfNecessary({
        topics: [
          {
            topic: 'topic-name',
            partitions: [{ partition: 0, offset: '500' }],
          },
        ],
      })
      uncommittedOffsets()
      isRunning()
      isStale()
      console.log(batch)
    },
    eachMessage: async ({ topic, partition, message }) => {
      const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
      console.log(`- ${prefix} ${message.key}#${message.value}`)
    },
  })
  await consumer.disconnect()
}

runConsumer().catch(e => console.error(`[example/consumer] ${e.message}`, e))

// PRODUCER
const producer = kafka.producer({ allowAutoTopicCreation: true })

const getRandomNumber = () => Math.round(Math.random() * 1000)
const createMessage = (num: number) => ({
  key: `key-${num}`,
  value: `value-${num}-${new Date().toISOString()}`,
})

const sendMessage = () => {
  return producer
    .send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: Array(getRandomNumber())
        .fill(0)
        .map(_ => createMessage(getRandomNumber())),
    })
    .then(console.log)
    .catch(e => console.error(`[example/producer] ${e.message}`, e))
}

const runProducer = async () => {
  await producer.connect()
  setInterval(sendMessage, 3000)
  await producer.disconnect()
}

runProducer().catch(e => console.error(`[example/producer] ${e.message}`, e))

// ADMIN
const admin = kafka.admin({ retry: { retries: 10 } })

const runAdmin = async () => {
  await admin.connect()
  await admin.fetchTopicMetadata({ topics: ['string'] })
  await admin.createTopics({
    topics: [{ topic, numPartitions: 10, replicationFactor: 1 }],
    timeout: 30000,
    waitForLeaders: true,
  })
  await admin.disconnect()
}

runAdmin().catch(e => console.error(`[example/admin] ${e.message}`, e))

// OTHERS
;async () => {
  await producer.send({
    topic: 'topic-name',
    compression: CompressionTypes.GZIP,
    messages: [{ key: 'key1', value: 'hello world!' }],
  })
}

const SnappyCodec: any = undefined
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec

kafka.consumer({
  groupId: 'my-group',
  partitionAssigners: [roundRobin],
})
