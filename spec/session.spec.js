import { Session } from '$lib/session.js'
import { redisClient } from '$lib/redis.js'

describe("Session", () => {

  let session, otherSession

  beforeAll(async () => {
    await Promise.all([
      redisClient.json.set('user:mephalich', '$', { name: 'Mephalich'}),
      redisClient.json.set('user:conrad', '$', { name: 'Conrad Taylor'}),
      redisClient.json.set('room:00000000000000000000000001', '$', { name: 'The Hub'})
    ])
  })

  beforeEach(async () => {
    session = new Session()
    await session.init('mephalich')

    otherSession = new Session()
    await otherSession.init('conrad')
  })

  afterEach(() => {
    session.destroy()
    otherSession.destroy()
  })

  afterAll(async () => {
    return redisClient.flushAll()
  })

  it("recevies a chat message from ourselves", async () => {
    return new Promise((resolve, reject) => {
      session.onMessage((message, channel) => {
        expect(channel).toBe(session.room.id)
        expect(message).toBe('Mephalich: foo')
        resolve()
      })
      session.sendCommand('foo')
    })
  })

  it("recevies a chat message from someone else", async () => {
    return new Promise((resolve, reject) => {
      session.onMessage((message, channel) => {
        expect(channel).toBe(session.room.id)
        expect(message).toBe('Conrad Taylor: bar')
        resolve()
      })
      otherSession.sendCommand('bar')
    })
  })
})
