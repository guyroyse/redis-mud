import { redisClient } from "./redis.js"
import { ulid } from "ulid"

const HUB_ULID = '00000000000000000000000001'

export class Room {

  #id = null

  constructor(id) {
    this.#id = id
  }

  static async create() {
    const room = new Room(ulid())
    await redisClient.json.set(`Room:${room.id}`, '$', { id: room.id })
    return room
  }

  static async fetchHub() {
    return await Room.fetch(HUB_ULID)
  }

  static async fetch(id) {
    const exists = await Room.exists(id)
    if (!exists) return null
    return new Room(id)
  }

  static async destroy(id) {
    return redisClient.unlink(Room.redisKey(id))
  }

  static async exists(id) {
    const exists = await redisClient.exists(Room.redisKey(id))
    return exists === 1
  }

  static redisKey(id) {
    return `Room:${id}`
  }

  async destroy() {
    await Room.destroy(this.id)
  }

  get id() {
    return this.#id
  }

  async name(value) {
    return this.setFetchProperty('$.name', value)
  }

  async description(value) {
    return this.setFetchProperty('$.description', value)
  }

  async setFetchProperty(path, value) {
    const key = Room.redisKey(this.id)
    return value === undefined ? this.fetchProperty(key, path) : this.setProperty(key, path, value)
  }

  async setProperty(key, path, value) {
    try {
      await redisClient.json.set(key, path, value)
    } catch (error) {
      if (error.message === "ERR new objects must be created at the root") {
        throw new Error("Room doesn't exist")
      } else {
        throw error
      }
    }
    return value
  }

  async fetchProperty(key, path) {
    const result = await redisClient.json.get(key, { path })
    if (result === null) throw new Error("Room doesn't exist")
    return result[0] ?? null
  }
}
