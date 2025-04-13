/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'

import { TokenService } from '../../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../../src/services/JwtService.js'

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

  it('OK', async function () {
    const accessToken = 'accessToken'
    const refreshToken = 'refreshToken'

    const payloadAccessToken = {
      user
    }

    const payloadRefreshToken = {
      user,
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
})
