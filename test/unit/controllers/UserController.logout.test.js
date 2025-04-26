/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserController } from '../../../src/controllers/UserController.js'
import createError from 'http-errors'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

const expect = chai.expect

describe('UserController.logout', () => {
  afterEach(() => {
    sinon.restore()
  })


  it(`Not ok, token reuse, status code should be 401.`, async () => {
    const tokenService = new TokenService()

    const req = {
      headers: {
        authorization: 'Bearer myValidRefreshToken'
      }
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub() 

    const err = createError(401, 'Token reuse is not allowed.')
    sinon.stub(tokenService, 'expire').throws(err)

    const userController = new UserController(tokenService)

    await userController.logout(req, res, next)

    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called
    expect(next).to.have.been.calledWithMatch(
      sinon.match
        .instanceOf(Error)
        .and(sinon.match.has('statusCode', 401))
    )
  })

  it('Ok, should return status code 204', async () => {
    const tokenService = new TokenService()

    sinon.stub(tokenService, 'expire').resolves()

    const req = {
      headers: {
        authorization: 'Bearer validRefreshToken'
      }
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      end: sinon.stub()
    }
    const next = sinon.stub()
    const userController = new UserController(tokenService)

    await userController.logout(req, res, next)

    expect(res.status).to.have.been.calledWith(204)
    expect(res.json).not.to.have.been.called
    expect(next).not.to.have.been.called
  })
})
