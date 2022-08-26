import { Session } from '$lib/session.js'
import { redisClient } from '$lib/redis.js'

describe("Session", () => {

  let mephalichSession, conradSession, leeroySession

  beforeAll(async () => {
    await Promise.all([
      redisClient.json.set('user:mephalich', '$', { name: 'Mephalich'}),
      redisClient.json.set('user:conrad', '$', { name: 'Conrad'}),
      redisClient.json.set('user:leeroy', '$', { name: 'Leeroy'}),
      redisClient.json.set('room:00000000000000000000000001', '$', {
        name: 'The Hub',
        description: 'This large, open, circular room has numerous doors. At the center, there is a large, oak reception desk.' })
    ])
  })

  beforeEach(async () => {
    mephalichSession = new Session()
    await mephalichSession.init('mephalich')

    conradSession = new Session()
    await conradSession.init('conrad')

    leeroySession = new Session()
    await leeroySession.init('leeroy')
  })

  afterEach(() => {
    mephalichSession.destroy()
    conradSession.destroy()
    leeroySession.destroy()
  })

  afterAll(async () => {
    return redisClient.flushAll()
  })

  it("recevies a chat message from ourselves", async () => {
    return new Promise((resolve, reject) => {
      mephalichSession.onMessage((message, channel) => {
        expect(channel).toBe(mephalichSession.room.id)
        expect(message).toBe('Mephalich: foo')
        resolve()
      })
      mephalichSession.sendCommand('foo')
    })
  })

  it("recevies a chat message from someone else", async () => {
    return new Promise((resolve, reject) => {
      conradSession.onMessage((message, channel) => {
        expect(channel).toBe(conradSession.room.id)
        expect(message).toBe('Mephalich: bar')
        resolve()
      })
      mephalichSession.sendCommand('bar')
    })
  })

  it("recevies a whisper message from ourselves", async () => {
    return new Promise((resolve, reject) => {
      mephalichSession.onMessage((message, channel) => {
        expect(channel).toBe(mephalichSession.user.id)
        expect(message).toBe('Mephalich (to Conrad): baz qux')
        resolve()
      })
      mephalichSession.sendCommand('/whisper conrad baz qux')
    })
  })

  it("recevies a whisper message directed at us and only us", async () => {
    return new Promise((resolve, reject) => {
      conradSession.onMessage((message, channel) => {
        expect(channel).toBe(conradSession.user.id)
        expect(message).toBe('Mephalich (to Conrad): baz qux')
        resolve()
      })
      mephalichSession.sendCommand('/whisper leeroy baz qux')
      mephalichSession.sendCommand('/whisper conrad baz qux')
    })
  })

  it("recevies a room description directed at us and only us when the user looks", async () => {
    return new Promise((resolve, reject) => {
      mephalichSession.onMessage((message, channel) => {
        expect(channel).toBe(mephalichSession.user.id)
        expect(message).toBe('The Hub\nThis large, open, circular room has numerous doors. At the center, there is a large, oak reception desk.')
        resolve()
      })
      leeroySession.sendCommand('/look')
      mephalichSession.sendCommand('/look')
    })
  })
})
