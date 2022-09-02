import { Room } from '$lib/room.js'
import { redisClient } from '$lib/redis.js'
import { afterEach, describe } from 'vitest'

const ROOM_NAME = "The Pit"
const ROOM_DESCRIPTION = "A deep, dark pit stares back at you."

describe("Room", () => {

  let createdRoom, fetchedRoom

  describe("when created", () => {

    beforeEach(async () => { createdRoom = await Room.create() })
    afterEach(async () => { await redisClient.unlink(`Room:${createdRoom.id}`) })

    it("has a valid id", () => expect(createdRoom.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/))
    it("has an empty name", async () => expect(createdRoom.name()).resolves.toBeNull())
    it("has an empty description", async () => expect(await createdRoom.description()).toBeNull())

    it("creates an empty document in Redis", async () => {
      const roomJson = await redisClient.json.get(`Room:${createdRoom.id}`, '$')
      expect(roomJson).toEqual({ id: createdRoom.id })
    })

    describe("when the properties are updated", () => {

      beforeEach(async () => {
        await createdRoom.name(ROOM_NAME)
        await createdRoom.description(ROOM_DESCRIPTION)
      })

      it("has the expected name", async () => expect(createdRoom.name()).resolves.toBe(ROOM_NAME))
      it("has the expected description", async () => expect(createdRoom.description()).resolves.toBe(ROOM_DESCRIPTION))

      it("has the expected document in Redis", async () => {
        const roomJson = await redisClient.json.get(`Room:${createdRoom.id}`, '$')
        expect(roomJson).toEqual({
          id: createdRoom.id,
          name: ROOM_NAME,
          description: ROOM_DESCRIPTION
        })
      })

      describe("when fetched", () => {

        beforeEach(() => { fetchedRoom = Room.fetch(createdRoom.id) })

        it("has the expected id", () => expect(fetchedRoom.id).toBe(createdRoom.id))
        it("has the expected name", async () => expect(fetchedRoom.name()).resolves.toBe(ROOM_NAME))
        it("has the expected description", async () => expect(fetchedRoom.description()).resolves.toBe(ROOM_DESCRIPTION))

        describe("when destroyed", () => {

          beforeEach(async () => { await fetchedRoom.destroy() })

          it("has nothing in Redis", async () => {
            const exists = await redisClient.exists(`Room:${fetchedRoom.id}`)
            expect(exists).toBe(0)
          })
        })
      })

      describe("when destroyed", () => {

        beforeEach(async () => { await Room.destroy(createdRoom.id) })

        it("has nothing in Redis", async () => {
          const exists = await redisClient.exists(`Room:${createdRoom.id}`)
          expect(exists).toBe(0)
        })
      })
    })
  })
})
