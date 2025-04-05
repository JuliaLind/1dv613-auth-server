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

describe('test tokenService.decodeRefreshToken', () => {
  const user = {
    username: 'julia'
  }

  const jti = '456'

  const tokenService = new TokenService()

  afterEach(async () => {
    sinon.restore()
  })

  it('TokenService.createNewTokenPair', async function () {
    const accessToken = 'accessToken'
    const refreshToken = 'refreshToken'

    const payloadAccessToken = {
      user
    }

    const payloadRefreshToken = {
      user,
      jti
    }

    sinon.stub(RefreshTokenModel, 'generate').resolves(jti)

    sinon.stub(JwtService, 'encodePayload').callsFake((payload) => {
      if (payload === payloadAccessToken) {
        return accessToken
      }
      if (payload === payloadRefreshToken) {
        return refreshToken
      }
    })

    const result = await tokenService.createNewTokenPair(user)
    const tokenPair = result[0]
    expect(tokenPair).to.have.property('accessToken', accessToken)
    expect(tokenPair).to.have.property('refreshToken', refreshToken)
    expect(result[1]).to.equal(jti)
    expect(RefreshTokenModel.generate).to.have.been.calledOnce
  })
})
