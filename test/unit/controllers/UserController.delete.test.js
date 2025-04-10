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
  before(() => {
    UserModel.deleteMany()
  })
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
        email: 'julia@lnu.se',
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

    tokenService.expireByUser = sinon.stub().resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).not.to.have.been.called
    expect(res.status).to.have.been.calledWith(204)
    expect(res.json).to.not.have.been.called

    expect(tokenService.expire).to.have.been.calledWith('123')
  })

  it('Not ok, validation failed', async () => {
    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      },
      body: {
        email: 'julia@lnu.se',
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
    tokenService.expire = sinon.stub().resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).to.have.been.calledWith(sinon.match({
      statusCode: 401
    }))
    expect(res.status).to.not.have.been.called
    expect(res.json).to.not.have.been.called

    expect(tokenService.expire).to.not.have.been.called
  })

  it('Not Ok, authentication failed', async () => {
    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      },
      body: {
        email: 'julia@lnu.com',
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
    sinon.stub(UserModel, 'authenticate').throws(createError(401, 'Credentials invalid or not provided.'))
    tokenService.expire = sinon.stub().resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).to.have.been.calledWith(sinon.match({
      statusCode: 401,
      message: 'Credentials invalid or not provided.'
    }))
    expect(res.status).to.not.have.been.called
    expect(res.json).to.not.have.been.called
    expect(tokenService.expire).to.not.have.been.called
  })
})
