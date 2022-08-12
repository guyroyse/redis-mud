import { redisClient } from "./redis.js"
import { Room } from "./room.js"
import { User } from "./user.js"

const GLOBAL_CHANNEL = '00000000000000000000000000'


export class Session {

  async init(userId) {

    this.user = User.fetchUser(userId)
    this.room = Room.fetchHub()

    this.roomSubscriber = redisClient.duplicate()

    await this.roomSubscriber.connect()

    await this.roomSubscriber.subscribe(this.room.id, (message, channel) => {
      if (this.callback) this.callback(message, channel)
    })
  }

  async destroy() {
    await this.roomSubscriber.unsubscribe(this.room.id)
  }

  async sendCommand(s) {
    const userName = await this.user.name()
    redisClient.publish(this.room.id, `${userName}: ${s}`)
  }

  onMessage(callback) {
    this.callback = callback
  }
}
