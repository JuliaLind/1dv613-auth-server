/* eslint-disable no-unused-expressions */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { TokenService } from '../../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

import sinon from 'sinon'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('TokenService.expire', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('OK', async function () {
    sinon.stub(RefreshTokenModel, 'expireByUser').resolves()
    const tokenService = new TokenService()
    const userId = '456'
    await tokenService.expireByUser(userId)

    expect(RefreshTokenModel.expireByUser).to.have.been.calledOnce
    expect(RefreshTokenModel.expireByUser).to.have.been.calledWith(userId)
  })
})
