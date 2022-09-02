import { redisClient } from "./redis.js"
import { Room } from "./room.js"
import { User } from "./user.js"

const GLOBAL_CHANNEL = '00000000000000000000000000'


export class Session {

  async init(userId) {

    this.user = User.fetch(userId)
    this.room = await Room.fetchHub()

    this.roomSubscriber = redisClient.duplicate()
    this.userSubscriber = redisClient.duplicate()

    await this.roomSubscriber.connect()
    await this.userSubscriber.connect()

    await this.roomSubscriber.subscribe(this.room.id, (message, channel) => {
      if (this.callback) this.callback(message, channel)
    })

    await this.userSubscriber.subscribe(this.user.id, (message, channel) => {
      if (this.callback) this.callback(message, channel)
    })
  }

  async destroy() {
    await this.roomSubscriber.unsubscribe(this.room.id)
    await this.userSubscriber.unsubscribe(this.user.id)
  }

  async sendCommand(s) {
    if (s.startsWith('/whisper ')) return this.processWhisper(s)
    if (s === '/look') return this.processLook()
    return this.processChat(s)
  }

  async processWhisper(s) {
    const [ , userId, message] = s.match(/^\/whisper (\S*) (.*)/)

    const fromUser = await this.user.name()
    const toUser = await User.fetch(userId).name()

    redisClient.publish(this.user.id, `${fromUser} (to ${toUser}): ${message}`)
    redisClient.publish(userId, `${fromUser} (to ${toUser}): ${message}`)
  }

  async processLook() {
    const name = await this.room.name()
    const description = await this.room.description()
    redisClient.publish(this.user.id, `${name}\n${description}`)
  }

  async processChat(s) {
    const fromUser = await this.user.name()
    redisClient.publish(this.room.id, `${fromUser}: ${s}`)
  }

  onMessage(callback) {
    this.callback = callback
  }
}
