import { redisClient } from "./redis.js"
import { ulid } from "ulid"

export class Thing {

  #id = null

  constructor(id) {
    this.#id = id
  }

  static async create() {
    const thing = new this(ulid())
    await redisClient.json.set(`${this.name}:${thing.id}`, '$', { id: thing.id })
    return thing
  }

  static async fetch(id) {
    const exists = await this.exists(id)
    if (!exists) return null
    return new this(id)
  }

  static async destroy(id) {
    return redisClient.unlink(this.redisKey(id))
  }

  static async exists(id) {
    const exists = await redisClient.exists(this.redisKey(id))
    return exists === 1
  }

  static redisKey(id) {
    return `${this.name}:${id}`
  }

  async destroy() {
    await this.constructor.destroy(this.id)
  }

  get id() {
    return this.#id
  }

  async setFetchProperty(path, value) {
    const key = this.constructor.redisKey(this.id)
    return value === undefined ? this.fetchProperty(key, path) : this.setProperty(key, path, value)
  }

  async setProperty(key, path, value) {
    try {
      await redisClient.json.set(key, path, value)
    } catch (error) {
      if (error.message === "ERR new objects must be created at the root") {
        throw new Error(`${this.constructor.name} doesn't exist`)
      } else {
        throw error
      }
    }
    return value
  }

  async fetchProperty(key, path) {
    const result = await redisClient.json.get(key, { path })
    if (result === null) throw new Error(`${this.constructor.name} doesn't exist`)
    return result[0] ?? null
  }
}
