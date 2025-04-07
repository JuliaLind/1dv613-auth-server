/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserController } from '../../../src/controllers/UserController.js'
import { UserModel } from '../../../src/models/UserModel.js'
import createError from 'http-errors'

const expect = chai.expect

describe('UserController.delete', () => {
  afterEach(() => {
    sinon.restore()
  })

  const refreshToken = 'myRefreshToken'

  it('Ok', async () => {
    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      },
      body: {
        username: 'julia',
        password: 'mypassword'
      }
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      end: sinon.stub()
    }
    const next = sinon.stub()

    const tokenService = new TokenService()
    tokenService.validate = sinon.stub().resolves('123')
    sinon.stub(UserModel, 'delete').resolves()
    tokenService.expire = sinon.stub().resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).not.to.have.been.called
    expect(res.status).to.have.been.calledWith(204)
    expect(res.json).to.not.have.been.called
    expect(tokenService.validate).to.have.been.calledWith(refreshToken, req.body.username)
    expect(UserModel.delete).to.have.been.calledWith(req.body.username, req.body.password)
    expect(tokenService.expire).to.have.been.calledWith('123')
  })

  it('Not ok, not the same username as in token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      },
      body: {
        username: 'julia',
        password: 'mypassword'
      }
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      end: sinon.stub()
    }
    const next = sinon.stub()

    const tokenService = new TokenService()
    tokenService.validate = sinon.stub().throws(createError(401))
    sinon.stub(UserModel, 'delete').resolves()
    tokenService.expire = sinon.stub().resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).to.have.been.calledWith(sinon.match({
      statusCode: 401
    }))
    expect(res.status).to.not.have.been.called
    expect(res.json).to.not.have.been.called
    expect(tokenService.validate).to.have.been.calledWith(refreshToken, req.body.username)
    expect(UserModel.delete).to.not.have.been.called
    expect(tokenService.expire).to.not.have.been.called
  })
})
