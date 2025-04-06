/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

chai.use(sinonChai)
const expect = chai.expect

describe('RefreshTokenModel', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('newJti', async () => {
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

    const jti = await RefreshTokenModel.newJti()
    expect(jti).to.equal('123')
    expect(RefreshTokenModel.create).to.have.been.calledOnce
  })

  it('authenticate OK', async () => {
    sinon.stub(RefreshTokenModel, 'expireChain').resolves()

    const token = {
      expired: false
    }
    sinon.stub(RefreshTokenModel, 'findById').resolves(token)

    const res = await RefreshTokenModel.authenticate('456')
    expect(res).to.equal(token)
  })

  it('authenticate Not OK', async () => {
    sinon.stub(RefreshTokenModel, 'expireChain').resolves()

    const token = {
      expired: true
    }
    sinon.stub(RefreshTokenModel, 'findById').resolves(token)

    await expect(RefreshTokenModel.authenticate('456')).to.be.rejectedWith('Token reuse is not allowed.')
    expect(RefreshTokenModel.expireChain).to.have.been.calledOnce
  })

  it('expireById OK', async () => {
    const token = {
      expired: false,
      save: sinon.stub().resolves()
    }
    sinon.stub(RefreshTokenModel, 'findById').resolves(token)

    await RefreshTokenModel.expireById('456')
    expect(token.expired).to.be.true
    expect(token.save).to.have.been.calledOnce
  })

  it('expireChain OK', async () => {
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
})
