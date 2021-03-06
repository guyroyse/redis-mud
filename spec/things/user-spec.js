const RedisGraphShim = require('../../mud/data/redis-graph-shim')
const UserQueries = require('../../mud/things/user-queries')
const { User, Room } = require('../../mud/things/things')

describe("User", function() {

  describe("#byName", function() {

    context("when found", function() {
      beforeEach(async function() {
        RedisGraphShim.prototype.executeAndReturnSingle
          .resolves(createAUserMap())
        this.result = await User.byName(A_USER_NAME)
      })
  
      it("askes the graph for the user", function() {
        expect(RedisGraphShim.prototype.executeAndReturnSingle)
          .to.have.been.calledWith(UserQueries.FETCH_BY_NAME, { name: A_USER_NAME })
      })
  
      it("returns a user with expected properties", function() {
        expect(this.result.id).to.equal(A_USER_ID)
        expect(this.result.name).to.equal(A_USER_NAME)
        expect(this.result.password).to.equal(A_USER_PASSWORD)
      })  
    })

    context("when not found", function() {
      beforeEach(async function() {
        RedisGraphShim.prototype.executeAndReturnSingle.resolves(null)
        this.result = await User.byName(A_USER_NAME)
      })
  
      it("askes the graph for the user", function() {
        expect(RedisGraphShim.prototype.executeAndReturnSingle)
          .to.have.been.calledWith(UserQueries.FETCH_BY_NAME, { name: A_USER_NAME })
      })
  
      it("returns null", function() {
        expect(this.result).to.be.null
      })  
    })
  })

  describe("#create", function() {
    beforeEach(async function() {
      RedisGraphShim.prototype.executeAndReturnSingle.resolves(createAUserMap())
      this.result = await User.create(A_USER_NAME, A_USER_PASSWORD)
    })

    it("creates the user", function() {
      expect(RedisGraphShim.prototype.executeAndReturnSingle)
        .to.have.been.calledWith(UserQueries.CREATE, { 
          name: A_USER_NAME,
          password: A_USER_PASSWORD })
    })
  
    it("has expected id", function() {
      expect(this.result.id).to.equal(A_USER_ID)
    })
  
    it("has expected password", function() {
      expect(this.result.password).to.equal(A_USER_PASSWORD)
    })
  
    context("when password is changed", function() {
      beforeEach(function() {
        this.result.password = ANOTHER_USER_PASSWORD
      })
  
      it("has the new password", function() {
        expect(this.result.password).to.equal(ANOTHER_USER_PASSWORD)
      })
  
      it("updates the graph", function() {
        expect(RedisGraphShim.prototype.execute)
          .to.have.been.calledWith(UserQueries.UPDATE, {
            id: A_USER_ID,
            password: ANOTHER_USER_PASSWORD
          })
      })
    })

    context("when fetching the current room", function() {
      beforeEach(async function() {
        sinon.stub(Room, 'forUser')

        this.aRoom = createARoom()
  
        Room.forUser.resolves(this.aRoom)
        this.room = await this.result.currentRoom()
      })

      it("fetches the room for the user", function() {
        expect(Room.forUser).to.have.been.calledWith(A_USER_ID)
      })
      
      it("returns the expected room", function() {
        expect(this.room).to.equal(this.aRoom)
      })
    })  
  })
})
