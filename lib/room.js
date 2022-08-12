import { redisClient } from "./redis.js"

const HUB_ULID = '00000000000000000000000001'

export class Room {

  static fetchHub() {
    return Room.fetchRoom(HUB_ULID)
  }

  static fetchRoom(id) {
    const room = new Room()
    room._id = id
    return room
  }

  get id() {
    return this._id
  }

  async name() {
    const result = await redisClient.json.get(`room:${this.id}`, '$.name')
    return result.name
  }

  async description() {
    const result = await redisClient.json.get(`room:${this.id}`, '$.description')
    return result.description
  }
}
