import { redisClient } from "./redis.js"
import { ulid } from "ulid"

const HUB_ULID = '00000000000000000000000001'

export class Room {

  static async create() {
    const room = new Room()
    room._id = ulid()
    await redisClient.json.set(`Room:${room.id}`, '$', { id: room.id })
    return room
  }

  static fetchHub() {
    return Room.fetch(HUB_ULID)
  }

  static fetch(id) {
    const room = new Room()
    room._id = id
    return room
  }

  static async destroy(id) {
    return redisClient.unlink(`Room:${id}`)
  }

  destroy() {
    Room.destroy(this.id)
  }

  get id() {
    return this._id
  }

  async name(value) {
    const result =  await this.getFetchProperty('$.name', value)
    return result?.name ?? null
  }

  async description(value) {
    const result =  await this.getFetchProperty('$.description', value)
    return result?.description ?? null
  }

  async getFetchProperty(path, value) {
    const key = `Room:${this.id}`
    if (value !== undefined) await redisClient.json.set(key, path, value)
    return await redisClient.json.get(key, path)
  }
}
