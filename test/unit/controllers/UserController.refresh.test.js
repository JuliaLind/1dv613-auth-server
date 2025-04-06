/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserController } from '../../../src/controllers/UserController.js'

const expect = chai.expect

describe('UserController.refresh', () => {
  afterEach(() => {
    sinon.restore()
  })


  it('Ok', async () => {
    const refreshToken = 'myRefreshToken'

    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      }
    }

    const tokenService = new TokenService()
    tokenService.refresh = sinon.stub().resolves()

    const res = {}
    const next = sinon.stub()
    const userController = new UserController(tokenService)
    await userController.refresh(req, res, next)

    expect(next).not.to.have.been.called
  })

  it('not ok, wrong header format', async () => {

  })

  it('not ok, refresh token expired', async () => {

  })

})
