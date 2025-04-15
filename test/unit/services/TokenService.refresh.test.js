/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { TokenService } from '../../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

import sinon from 'sinon'
import createError from 'http-errors'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('TokenService.refresh', () => {
  afterEach(() => {
    sinon.restore()
  })

  const refreshToken = 'someRefreshToken'

  const payload = {
    user: {
      username: 'julia'
    },
    jti: '456'
  }

  it('Not Ok, refreshToken reuse. Error should have status code 401. New tokens should not be generated.', async function () {
    const tokenService = new TokenService()
    tokenService.decodeRefreshToken = sinon.stub().resolves(payload)
    tokenService.newTokenPair = sinon.stub()

    const errMsg = 'Token reuse is not allowed'

    const error = createError(401, errMsg)
    sinon.stub(RefreshTokenModel, 'authenticate').callsFake((jti) => {
      if (jti === payload.jti) {
        throw error
      }
    })

    await expect(tokenService.refresh(refreshToken))
      .to.be.rejected.then(err => {
        expect(err.message).to.equal(errMsg)
        expect(err).to.have.property('statusCode', 401)
      })

    expect(tokenService.decodeRefreshToken).to.have.been.calledOnce
    expect(tokenService.newTokenPair).to.not.have.been.called
  })

  it('Ok', async function () {
    const tokenService = new TokenService()
    tokenService.decodeRefreshToken = sinon.stub().resolves(payload)

    const oldTokenDoc = {
      chain: sinon.stub().resolves()
    }
    sinon.stub(RefreshTokenModel, 'authenticate').resolves(oldTokenDoc)
    const accessToken = 'accessToken'

    tokenService.newTokenPair = sinon.stub().resolves({
      tokens: {
        accessToken,
        refreshToken
      },
      jti: payload.jti
    })

    const result = await tokenService.refresh(refreshToken)

    expect(result).to.deep.equal({
      accessToken,
      refreshToken
    })
    expect(oldTokenDoc.chain).to.have.been.calledWith(payload.jti)
  })
})
