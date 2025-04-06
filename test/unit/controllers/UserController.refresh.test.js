/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserController } from '../../../src/controllers/UserController.js'
import createError from 'http-errors'

const expect = chai.expect

describe('UserController.refresh', () => {
  afterEach(() => {
    sinon.restore()
  })

  const refreshToken = 'myRefreshToken'

  const validHeaders = [
    {
      authorization: 'Bearer ' + refreshToken
    },
    {
      authorization: 'bearer ' + refreshToken
    }
  ]

  for (const header of validHeaders) {
    const newAccessToken = 'myAccessToken'
    const newRefreshToken = 'myNewRefreshToken'

    const tokenPair = {
      newRefreshToken,
      newAccessToken
    }

    it('Ok', async () => {
      const req = {
        headers: header
      }

      const tokenService = new TokenService()
      tokenService.refresh = sinon.stub().resolves(tokenPair)

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      const next = sinon.stub()
      const userController = new UserController(tokenService)
      await userController.refresh(req, res, next)

      expect(next).not.to.have.been.called
      expect(res.status).to.have.been.calledWith(201)
      expect(res.json).to.have.been.calledWith(tokenPair)
    })
  }

  const invalidHeaders = [
    {},
    {
      authorization: undefined
    },
    {
      authorization: null
    },
    {
      authorization: 'Bearer '
    },
    {
      authorization: ''
    },
    {
      'X-jwt-token': 'Bearer ' + refreshToken
    },
    {
      authorization: 'notbearer ' + refreshToken
    }
  ]

  for (const header of invalidHeaders) {
    it('not ok, wrong header format', async () => {
      const tokenService = new TokenService()
      tokenService.refresh = sinon.stub().resolves()

      const req = {
        headers: header
      }
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      const next = sinon.stub()

      const userController = new UserController(tokenService)
      await userController.refresh(req, res, next)
      expect(res.status).not.to.have.been.called
      expect(res.json).not.to.have.been.called
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
        .having.property('statusCode', 401)
        .having.property('message', 'Invalid token format')
    })
  }

  it('not ok, refresh token expired', async () => {
    const tokenService = new TokenService()
    const error = createError(401, 'Token is invalid or expired.')
    tokenService.refresh = sinon.stub().rejects(error)

    const req = {
      headers: {
        authorization: 'Bearer ' + refreshToken
      }
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()
    const userController = new UserController(tokenService)
    await userController.refresh(req, res, next)
    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error))
      .having.property('statusCode', 401)
      .having.property('message', 'Token is invalid or expired.')
  })
})
