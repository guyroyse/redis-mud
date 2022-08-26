import { Room } from '$lib/room.js'
import { redisClient } from '$lib/redis.js'
import { afterEach, describe } from 'vitest'

describe("Room", () => {

  let room

  describe("when created", () => {

    beforeEach(async () => {
      room = await Room.create()
    })

    afterEach(async () => {
      await redisClient.unlink(`Room:${room.id}`)
    })

    it("has a valid id", () => expect(room.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/))
    it("has an empty name", async () => expect(room.name()).resolves.toBeNull())
    it("has an empty description", async () => expect(await room.description()).toBeNull())

    it("creates an empty document in Redis", async () => {
      const roomJson = await redisClient.json.get(`Room:${room.id}`, '$')
      expect(roomJson).toEqual({ id: room.id })
    })

    describe("when the properties are updated", () => {
      beforeEach(async () => {
        await room.name("The Pit")
        await room.description("A deep, dark pit stares back at you.")
      })
      it("has the expected name", async () => expect(room.name()).resolves.toBe("The Pit"))
      it("has the expected name", async () => expect(room.description()).resolves.toBe("A deep, dark pit stares back at you."))
    })
  })
})
