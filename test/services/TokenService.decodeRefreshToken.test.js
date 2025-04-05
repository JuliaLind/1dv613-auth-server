/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'

import fs from 'fs/promises'

import { TokenService } from '../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../src/lib/JwtService.js'
import sinon from 'sinon'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect

describe('test tokenService', () => {
  const user = {
    username: 'julia'
  }

  const jti = '456'

  const payload = {
    user,
    jti
  }

  const refreshToken = 'refreshToken'

  afterEach(async () => {
    sinon.restore()
  })

  it('Decode ok, not expired', async function () {
    const tokenService = new TokenService()

    sinon.stub(JwtService, 'decodePayload').resolves(payload)
    sinon.stub(JwtService, 'decodeWithoutVerify')
    sinon.stub(RefreshTokenModel, 'expire')

    const decoded = await tokenService.decodeRefreshToken(refreshToken)

    expect(decoded.user.username).to.equal(user.username)
    expect(decoded).to.have.property('jti', jti)
    expect(JwtService.decodeWithoutVerify).to.not.have.been.called
    expect(RefreshTokenModel.expire).to.not.have.been.called
  })

  it('Decode not ok, jwt expired (token expiration date)', async function () {
    const tokenService = new TokenService()

    const error = new Error('jwt expire')
    error.name = 'TokenExpiredError'

    sinon.stub(JwtService, 'decodePayload').throws(error)
    sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)
    sinon.stub(RefreshTokenModel, 'expire')

    expect(() => tokenService.decodeRefreshToken(refreshToken))
      .to.throw()
      .with.property('statusCode', 401)

    expect(JwtService.decodeWithoutVerify).to.have.been.calledWith(refreshToken)
    expect(RefreshTokenModel.expire).to.have.been.calledWith(jti)
  })

  it('Decode not ok, jwt missing or malformed', async function () {
    const tokenService = new TokenService()
    const error = new Error()

    sinon.stub(JwtService, 'decodePayload').throws(error)
    sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)
    sinon.stub(RefreshTokenModel, 'expire')

    expect(() => tokenService.decodeRefreshToken(refreshToken))
      .to.throw()
      .with.property('statusCode', 401)

    expect(JwtService.decodeWithoutVerify).to.not.have.been.called
    expect(RefreshTokenModel.expire).to.not.have.been.called
  })
})
