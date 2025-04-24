/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import mongoose from 'mongoose'

import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

chai.use(sinonChai)
const expect = chai.expect

describe('RefreshTokenModel', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('newJti method should create a new document in the database', async () => {
    const refreshTokenDoc = {
      _id: {
        /**
         * Returns the stringified id of the token.
         *
         * @returns {string} The stringified id of the token.
         */
        toString: () => '123'
      }
    }

    sinon.stub(RefreshTokenModel, 'create').resolves(refreshTokenDoc)

    const userId = new mongoose.Types.ObjectId()
    const jti = await RefreshTokenModel.newJti(userId)

    expect(RefreshTokenModel.create).to.have.been.calledOnce // ensure only one document is created
    expect(RefreshTokenModel.create).to.have.been.calledWith(sinon.match({
      user: userId,
      expired: false,
      next: null
    }))
    expect(jti).to.equal('123')
  })

  it('authenticate OK - when refresh token document is found and is not expired the document should be returned.', async () => {
    sinon.stub(RefreshTokenModel, 'expireChain').resolves()

    const token = {
      expired: false,
      user: {
        _id: new mongoose.Types.ObjectId(),
        birthdate: new Date(1989, 2, 24)
      }
    }

    sinon.stub(RefreshTokenModel, 'findById').returns({
      populate: sinon.stub().resolves(token)
    })

    const res = await RefreshTokenModel.authenticate('456')
    expect(res).to.equal(token)
  })

  it('authenticate Not OK - the token document is expired, should throw error with status code 401. The token chain should get expired.', async () => {
    sinon.stub(RefreshTokenModel, 'expireChain').resolves()

    const token = {
      expired: true,
      user: {
        _id: new mongoose.Types.ObjectId(),
        birthdate: new Date(1989, 2, 24)
      }
    }

    sinon.stub(RefreshTokenModel, 'findById').returns({
      populate: sinon.stub().resolves(token)
    })

    await expect(RefreshTokenModel.authenticate('456')).to.be.rejected
      .then(err => {
        expect(err).to.have.property('status', 401)
      })

    expect(RefreshTokenModel.expireChain).to.have.been.calledWith(token)
  })

  it('authenticate Not OK - the token document does not exist, should throw error.', async () => {
    sinon.stub(RefreshTokenModel, 'findById').returns({
      populate: sinon.stub().resolves(null)
    })

    await expect(RefreshTokenModel.authenticate('456')).to.be.rejectedWith('Token not found.')
  })

  it('expireById OK - should work to expire a token by it\'s id', async () => {
    const token = {
      expired: false,
      user: {
        _id: new mongoose.Types.ObjectId(),
        birthdate: new Date(1989, 2, 24)
      },
      save: sinon.stub().resolves()
    }

    sinon.stub(RefreshTokenModel, 'findById').returns({
      populate: sinon.stub().resolves(token)
    })

    await RefreshTokenModel.expireById('456')
    expect(token.expired).to.be.true
    expect(token.save).to.have.been.calledOnce
  })

  it('expireChain OK - should expire a chain of three tokens', async () => {
    const token3 = {
      _id: {
        /**
         * Returns the stringified id of the token.
         *
         * @returns {string} The stringified id of the token.
         */
        toString: () => '789'
      },
      expire: sinon.stub().resolves(null)
    }

    const token2 = {
      _id: {
        /**
         * Returns the stringified id of the token.
         *
         * @returns {string} The stringified id of the token.
         */
        toString: () => '456'
      },
      expire: sinon.stub().resolves(token3._id),
      save: sinon.stub().resolves()
    }

    const token1 = {
      expire: sinon.stub().resolves(token2._id)
    }
    sinon.stub(RefreshTokenModel, 'findById').callsFake((id) => {
      if (id === token2._id) {
        return Promise.resolve(token2)
      }
      if (id === token3._id) {
        return Promise.resolve(token3)
      }
      return Promise.resolve(null)
    })

    await RefreshTokenModel.expireChain(token1)
    expect(token1.expire).to.have.been.calledOnce
    expect(token2.expire).to.have.been.calledOnce
    expect(token3.expire).to.have.been.calledOnce
  })

  it('chain ok - token should get expired when it is chained to a new token.', async () => {
    const doc = new RefreshTokenModel({
      next: null,
      expired: false
    })

    sinon.stub(doc, 'save').resolves()

    const newTokenId = new mongoose.Types.ObjectId()

    await doc.chain(newTokenId)

    expect(doc.next).to.equal(newTokenId)
    expect(doc.expired).to.be.true
    expect(doc.save).to.have.been.calledOnce
  })

  it('expireByUser Ok - should expire all active refresh tokens of a user.', async () => {
    const userId = new mongoose.Types.ObjectId()
    const doc1 = new RefreshTokenModel({
      user: userId,
      expired: false,
      next: null
    })

    const doc2 = new RefreshTokenModel({
      user: userId,
      expired: false,
      next: null
    })

    const doc3 = new RefreshTokenModel({
      user: userId,
      expired: false,
      next: null
    })

    sinon.stub(doc1, 'expire').resolves()
    sinon.stub(doc2, 'expire').resolves()
    sinon.stub(doc3, 'expire').resolves()

    sinon.stub(RefreshTokenModel, 'find').resolves([doc1, doc2, doc3])

    await RefreshTokenModel.expireByUser(userId)

    expect(doc1.expire).to.have.been.calledOnce
    expect(doc2.expire).to.have.been.calledOnce
    expect(doc3.expire).to.have.been.calledOnce

    expect(RefreshTokenModel.find).to.have.been.calledOnce
    expect(RefreshTokenModel.find).to.have.been.calledWith(sinon.match({
      user: userId,
      expired: false
    }))
  })

  it('expire ok - the expired property should be set to true when the expire instance method is called', async () => {
    const doc = new RefreshTokenModel({
      next: null,
      expired: false,
      user: new mongoose.Types.ObjectId()
    })

    sinon.stub(doc, 'save').resolves()

    const res = await doc.expire()

    expect(res).to.be.null
    expect(doc.expired).to.be.true
    expect(doc.save).to.have.been.calledOnce
  })
})
