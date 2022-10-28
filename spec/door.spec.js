import { Door } from '$lib/door.js'
import { redisClient } from '$lib/redis.js'
import { afterEach } from 'vitest'
import { Room } from '../lib/room'

const DOOR_NAME = "Rusty Ladder"
const DOOR_DESCRIPTION = "This old ladder leads up and out of the pit."

describe("Door", () => {

  let createdDoor, fetchedDoor, exists, room

  describe("when created", () => {

    beforeEach(async () => {
      createdDoor = await Door.create()
      room = await Room.create()
    })

    afterEach(async () => {
      await redisClient.unlink(`Door:${createdDoor.id}`)
      await redisClient.unlink(`Room:${room.id}`)
    })

    it("has a valid id", () => expect(createdDoor.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/))
    it("has an empty name", async () => expect(createdDoor.name()).resolves.toBeNull())
    it("has an empty description", async () => expect(createdDoor.description()).resolves.toBeNull())
    it("has no room", async () => expect(createdDoor.room()).resolves.toBeNull())

    it("creates an empty document in Redis", async () => {
      const doorJson = await redisClient.json.get(`Door:${createdDoor.id}`, '$')
      expect(doorJson).toEqual({ id: createdDoor.id })
    })

    it("exists", async () => expect(Door.exists(createdDoor.id)).resolves.toBe(true))

    describe("when the properties are updated", () => {

      beforeEach(async () => {
        await createdDoor.name(DOOR_NAME)
        await createdDoor.description(DOOR_DESCRIPTION)
        await createdDoor.room(room)
      })

      it("has the expected name", async () => expect(createdDoor.name()).resolves.toBe(DOOR_NAME))
      it("has the expected description", async () => expect(createdDoor.description()).resolves.toBe(DOOR_DESCRIPTION))
      it("has the expected room", async () => expect(createdDoor.room()).resolves.toEqual(room))

      it("has the expected document in Redis", async () => {
        const doorJson = await redisClient.json.get(`Door:${createdDoor.id}`, '$')
        expect(doorJson).toEqual({
          id: createdDoor.id,
          name: DOOR_NAME,
          description: DOOR_DESCRIPTION,
          roomId: room.id
        })
      })

      describe("when fetched", () => {

        beforeEach(async () => { fetchedDoor = await Door.fetch(createdDoor.id) })

        it("has the expected id", () => expect(fetchedDoor.id).toBe(createdDoor.id))
        it("has the expected name", async () => expect(fetchedDoor.name()).resolves.toBe(DOOR_NAME))
        it("has the expected description", async () => expect(fetchedDoor.description()).resolves.toBe(DOOR_DESCRIPTION))
        it("has the expected room", async () => expect(createdDoor.room()).resolves.toEqual(room))

        describe("when destroyed", () => {

          beforeEach(async () => { await fetchedDoor.destroy() })

          it("has nothing in Redis", async () => {
            const exists = await redisClient.exists(`Door:${fetchedDoor.id}`)
            expect(exists).toBe(0)
          })

          it("complains that the door was destroyed when checking the name", async () => {
            expect(async () => await fetchedDoor.name()).rejects.toThrowError("Door doesn't exist")
          })

          it("complains that the door was destroyed when checking the description", async () => {
            expect(async () => await fetchedDoor.description()).rejects.toThrowError("Door doesn't exist")
          })

          it("complains that the door was destroyed when checking the room", async () => {
            expect(async () => await fetchedDoor.room()).rejects.toThrowError("Door doesn't exist")
          })

          it("complains that the door was destroyed when setting the name", async () => {
            expect(async () => await fetchedDoor.name(DOOR_NAME)).rejects.toThrowError("Door doesn't exist")
          })

          it("complains that the door was destroyed when setting the description", async () => {
            expect(async () => await fetchedDoor.description(DOOR_DESCRIPTION)).rejects.toThrowError("Door doesn't exist")
          })

          it("complains that the door was destroyed when setting the room", async () => {
            expect(async () => await fetchedDoor.room(room)).rejects.toThrowError("Door doesn't exist")
          })
        })
      })

      describe("when destroyed", () => {

        beforeEach(async () => { await Door.destroy(createdDoor.id) })

        it("no longer exists", async () => expect(Door.exists(createdDoor.id)).resolves.toBe(false))

        it("has nothing in Redis", async () => {
          const exists = await redisClient.exists(`Door:${createdDoor.id}`)
          expect(exists).toBe(0)
        })
      })
    })

    describe("when the properties are updated to null", () => {

      beforeEach(async () => {
        await createdDoor.name(null)
        await createdDoor.description(null)
        await createdDoor.room(null)
      })

      it("has a null name", async () => expect(createdDoor.name()).resolves.toBeNull())
      it("has a null description", async () => expect(createdDoor.description()).resolves.toBeNull())
      it("has a null room", async () => expect(createdDoor.room()).resolves.toBeNull())

      it("has the expected document in Redis", async () => {
        const doorJson = await redisClient.json.get(`Door:${createdDoor.id}`, '$')
        expect(doorJson).toEqual({
          id: createdDoor.id,
          name: null,
          description: null,
          roomId: null
        })
      })
    })
  })

  describe("when fetching a missing door", () => {
    beforeEach(async () => { fetchedDoor = await Door.fetch('BOGUS_ID') })
    it("returns null", () => expect(fetchedDoor).toBeNull())
  })

  describe("when checking the existence of a missing door", () => {
    beforeEach(async () => { exists = await Door.exists('BOGUS_ID') })
    it("returns false", () => expect(exists).toBe(false))
  })
})
