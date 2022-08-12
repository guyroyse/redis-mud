import { redisClient } from "./redis.js"

export class User {

  static fetchUser(id) {
    const user = new User()
    user._id = id
    return user
  }

  get id() {
    return this._id
  }

  async name() {
    const result = await redisClient.json.get(`user:${this.id}`, '$.name')
    return result.name
  }
}
