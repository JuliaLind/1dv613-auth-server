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

describe('TokenService.expire', () => {
  const jti = '456'

  const payload = {
    jti
  }

  const tokenService = new TokenService()

  afterEach(() => {
    sinon.restore()
  })

  it('Should call JwtService and RefreshTokenModel', async function () {
    const refreshToken = 'myRefreshTokenToExpire'
    sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)
    sinon.stub(RefreshTokenModel, 'expireById')

    await tokenService.expire(refreshToken)

    expect(JwtService.decodeWithoutVerify).to.have.been.calledOnceWith(
      refreshToken
    )
    expect(RefreshTokenModel.expireById).to.have.been.calledOnceWith(jti)
  })
})
