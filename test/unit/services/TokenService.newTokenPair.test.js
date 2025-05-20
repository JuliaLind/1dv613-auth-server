/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import fs from 'fs/promises'

import { TokenService } from '../../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../../src/services/JwtService.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect

describe('TokenService.newTokenPair', () => {
  const user = {
    email: 'julia@lnu.se'
  }

  const jti = '456'

  const tokenService = new TokenService()

  afterEach(() => {
    sinon.restore()
  })

  it('OK, should return pair of tokens (access token and refresh token) and the jti of the new refresh token', async function () {
    const accessToken = 'accessToken'
    const refreshToken = 'refreshToken'

    const payloadAccessToken = {
      user
    }

    const payloadRefreshToken = {
      jti
    }

    sinon.stub(RefreshTokenModel, 'newJti').resolves(jti)

    sinon.stub(JwtService, 'encode').callsFake((payload) => {
      if (JSON.stringify(payload) === JSON.stringify(payloadAccessToken)) {
        return accessToken
      }
      if (JSON.stringify(payload) === JSON.stringify(payloadRefreshToken)) {
        return refreshToken
      }
    })

    const result = await tokenService.newTokenPair(user)
    const tokenPair = result.tokens

    expect(tokenPair).to.have.property('accessToken', accessToken)
    expect(tokenPair).to.have.property('refreshToken', refreshToken)
    expect(result.jti).to.equal(jti)
    expect(RefreshTokenModel.newJti).to.have.been.calledOnce
  })

  it('Req 1.3.1 + 1.3.2 - accessToken should be valid 2h and refresh token 48h', async function () {
    sinon.stub(RefreshTokenModel, 'newJti').resolves(jti)

    sinon.stub(JwtService, 'encode')

    await tokenService.newTokenPair(user)

    const accessTokenExp = JwtService.encode.getCall(0).args[2]
    const refreshTokenExp = JwtService.encode.getCall(1).args[2]

    expect(accessTokenExp).to.equal('2h')
    expect(refreshTokenExp).to.equal('2d')
  })
})
