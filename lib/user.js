import { redisClient } from "./redis.js"

export class User {

  static fetch(id) {
    const user = new User()
    user._id = id
    return user
  }

  get id() {
    return this._id
  }

  async name() {
    const result = await redisClient.json.get(`User:${this.id}`, '$.name')
    return result.name
  }
}
