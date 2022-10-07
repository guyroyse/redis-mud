import { Thing } from "./thing.js"

export class Door extends Thing {

  async name(value) {
    return this.setFetchProperty('$.name', value)
  }

  async description(value) {
    return this.setFetchProperty('$.description', value)
  }
}
