/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserModel } from '../../../src/models/UserModel.js'
import { UserController } from '../../../src/controllers/UserController.js'

const expect = chai.expect

describe('UserController.login', () => {
  afterEach(() => {
    sinon.restore()
  })

  const email = 'julia@lnu.com'
  const password = 'mypassword'

  const user = {
    email
  }

  const tokens = {
    accessToken: 'myAccessToken',
    refreshToken: 'myRefreshToken'
  }

  const jti = '123'

  it('Ok', async () => {
    const body = {
      email,
      password
    }

    sinon.stub(UserModel, 'authenticate').resolves(user)
    const tokenService = new TokenService()
    tokenService.newTokenPair = sinon.stub().resolves({
      tokens,
      jti
    })

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController(tokenService)
    await userController.login(req, res, next)
    expect(res.status).to.have.been.calledWith(201)
    expect(res.json).to.have.been.calledWith(tokens)
    expect(next).not.to.have.been.called
    expect(UserModel.authenticate).to.have.been.calledWith(email, password)
    expect(tokenService.newTokenPair).to.have.been.calledWith(user)
  })

  it('not ok, faied authentication', async () => {
    const body = {
      email,
      password
    }

    sinon.stub(UserModel, 'authenticate').rejects(new Error('Credentials invalid or not provided.'))

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController()
    await userController.login(req, res, next)
    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
  })
})
