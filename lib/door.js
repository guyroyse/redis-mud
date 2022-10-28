import { Room } from "./room.js"
import { Thing } from "./thing.js"

export class Door extends Thing {

  async name(value) { return this.setFetchProperty('$.name', value) }
  async description(value) { return this.setFetchProperty('$.description', value) }

  async room(value) {
    let roomId
    if (value === undefined) {
      roomId = await this.setFetchProperty('$.roomId')
    } else {
      roomId = value === null ? null : value.id
      roomId = await this.setFetchProperty('$.roomId', roomId)
    }
    return roomId === null ? null : Room.fetch(roomId)
  }
}
