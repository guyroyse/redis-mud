import { redisClient } from "./redis.js"
import { ulid } from "ulid"

const HUB_ULID = '00000000000000000000000001'

export class Room {

  #id = null
  #destroyed = false

  constructor(id) {
    this.#id = id
    this.#destroyed = false
  }

  async init() {
    const keyspaceClient = redisClient.duplicate()
    await keyspaceClient.connect()

    keyspaceClient.pSubscribe(`_keyspace@0__:${Room.redisKey(this.id)}`, (message, channel) => {
      if (message === 'del') this.#destroyed = true
    })

    return this
  }

  static async create() {
    const room = await new Room(ulid()).init()
    await redisClient.json.set(`Room:${room.id}`, '$', { id: room.id })
    return room
  }

  static async fetchHub() {
    return await Room.fetch(HUB_ULID)
  }

  static async fetch(id) {
    const exists = await Room.exists(id)
    if (!exists) return null

    return await new Room(id).init()
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
    const result =  await this.getFetchProperty('$.name', value)
    return result?.name ?? null
  }

  async description(value) {
    const result =  await this.getFetchProperty('$.description', value)
    return result?.description ?? null
  }

  async getFetchProperty(path, value) {
    if (this.#destroyed) throw new Error("Room doesn't exist")
    const key = Room.redisKey(this.id)
    if (value !== undefined) await redisClient.json.set(key, path, value)
    return await redisClient.json.get(key, path)
  }
}
