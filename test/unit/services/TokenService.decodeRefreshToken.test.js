/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { TokenService } from '../../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../../src/services/JwtService.js'
import sinon from 'sinon'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('TokenService.decodeRefreshToken', () => {
  const jti = '456'

  const payload = {
    jti
  }

  const refreshToken = 'refreshToken'
  const tokenService = new TokenService()

  afterEach(() => {
    sinon.restore()
  })

  it('Decode ok - token not expired. ', async function () {
    sinon.stub(JwtService, 'decode').resolves(payload)
    sinon.stub(JwtService, 'decodeWithoutVerify')
    sinon.stub(RefreshTokenModel, 'expireById')

    const decoded = await tokenService.decodeRefreshToken(refreshToken)

    expect(decoded).to.have.property('jti', jti)
    expect(JwtService.decodeWithoutVerify).to.not.have.been.called
    expect(RefreshTokenModel.expireById).to.not.have.been.called
  })

  it('Decode not ok, jwt expired (token expiration date). jti document should get expired in the database. Error statuscode should be 401.', async function () {
    const error = new Error('jwt expired')
    error.name = 'TokenExpiredError'

    sinon.stub(JwtService, 'decode').throws(error)
    sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)
    sinon.stub(RefreshTokenModel, 'expireById')

    await expect(tokenService.decodeRefreshToken(refreshToken))
      .to.be.rejected
      .then(err => {
        expect(err.message).to.equal('jwt expired')
        expect(err).to.have.property('statusCode', 401)
      })

    expect(JwtService.decodeWithoutVerify).to.have.been.calledWith(refreshToken)
    expect(RefreshTokenModel.expireById).to.have.been.calledWith(jti)
  })

  it('Decode not ok, jwt missing or malformed. Error status code should be 401.', async function () {
    const error = new Error('invalid token')

    sinon.stub(JwtService, 'decode').throws(error)
    sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)
    sinon.stub(RefreshTokenModel, 'expireById')

    await expect(tokenService.decodeRefreshToken(refreshToken))
      .to.be.rejected
      .then(err => {
        expect(err.message).to.equal('invalid token')
        expect(err).to.have.property('statusCode', 401)
      })

    expect(JwtService.decodeWithoutVerify).to.not.have.been.called
    expect(RefreshTokenModel.expireById).to.not.have.been.called
  })
})
