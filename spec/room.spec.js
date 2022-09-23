import { Room } from '$lib/room.js'
import { redisClient } from '$lib/redis.js'
import { afterEach, describe, expect, it } from 'vitest'

const ROOM_NAME = "The Pit"
const ROOM_DESCRIPTION = "A deep, dark pit stares back at you."

describe("Room", () => {

  let createdRoom, fetchedRoom, exists

  describe("when created", () => {

    beforeEach(async () => { createdRoom = await Room.create() })
    afterEach(async () => { await redisClient.unlink(`Room:${createdRoom.id}`) })

    it("has a valid id", () => expect(createdRoom.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/))
    it("has an empty name", async () => expect(createdRoom.name()).resolves.toBeNull())
    it("has an empty description", async () => expect(createdRoom.description()).resolves.toBeNull())

    it("creates an empty document in Redis", async () => {
      const roomJson = await redisClient.json.get(`Room:${createdRoom.id}`, '$')
      expect(roomJson).toEqual({ id: createdRoom.id })
    })

    it("exists", async () => expect(Room.exists(createdRoom.id)).resolves.toBe(true))

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

        beforeEach(async () => { fetchedRoom = await Room.fetch(createdRoom.id) })

        it("has the expected id", () => expect(fetchedRoom.id).toBe(createdRoom.id))
        it("has the expected name", async () => expect(fetchedRoom.name()).resolves.toBe(ROOM_NAME))
        it("has the expected description", async () => expect(fetchedRoom.description()).resolves.toBe(ROOM_DESCRIPTION))

        describe("when destroyed", () => {

          beforeEach(async () => { await fetchedRoom.destroy() })

          it("has nothing in Redis", async () => {
            const exists = await redisClient.exists(`Room:${fetchedRoom.id}`)
            expect(exists).toBe(0)
          })

          it("complains that the room was destroyed when checking the name", async () => {
            expect(async () => await fetchedRoom.name()).rejects.toThrowError("Room doesn't exist")
          })

          it("complains that the room was destroyed when checking the description", async () => {
            expect(async () => await fetchedRoom.description()).rejects.toThrowError("Room doesn't exist")
          })

          it("complains that the room was destroyed when setting the name", async () => {
            expect(async () => await fetchedRoom.name(ROOM_NAME)).rejects.toThrowError("Room doesn't exist")
          })

          it("complains that the room was destroyed when setting the description", async () => {
            expect(async () => await fetchedRoom.description(ROOM_DESCRIPTION)).rejects.toThrowError("Room doesn't exist")
          })
        })
      })

      describe("when destroyed", () => {

        beforeEach(async () => { await Room.destroy(createdRoom.id) })

        it("no longer exists", async () => expect(Room.exists(createdRoom.id)).resolves.toBe(false))

        it("has nothing in Redis", async () => {
          const exists = await redisClient.exists(`Room:${createdRoom.id}`)
          expect(exists).toBe(0)
        })
      })
    })

    describe("when the properties are updated to null", () => {

      beforeEach(async () => {
        await createdRoom.name(null)
        await createdRoom.description(null)
      })

      it("has a null name", async () => expect(createdRoom.name()).resolves.toBeNull())
      it("has a null description", async () => expect(createdRoom.description()).resolves.toBeNull())

      it("has the expected document in Redis", async () => {
        const roomJson = await redisClient.json.get(`Room:${createdRoom.id}`, '$')
        expect(roomJson).toEqual({
          id: createdRoom.id,
          name: null,
          description: null
        })
      })
    })
  })

  describe("when fetching a missing room", () => {
    beforeEach(async () => { fetchedRoom = await Room.fetch('BOGUS_ID') })
    it("returns null", () => expect(fetchedRoom).toBeNull())
  })

  describe("when checking the existence of a missing room", () => {
    beforeEach(async () => { exists = await Room.exists('BOGUS_ID') })
    it("returns false", () => expect(exists).toBe(false))
  })
})
