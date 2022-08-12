import { Session } from '$lib/session.js'
import { afterEach } from 'vitest'

describe("Session", () => {

  let session, otherSession

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
