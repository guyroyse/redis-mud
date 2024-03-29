import { Thing } from "./thing.js"

const HUB_ULID = '00000000000000000000000001'

export class Room extends Thing {

  static async fetchHub() {
    return await this.fetch(HUB_ULID)
  }

  async name(value) {
    return this.setFetchProperty('$.name', value)
  }

  async description(value) {
    return this.setFetchProperty('$.description', value)
  }
}
