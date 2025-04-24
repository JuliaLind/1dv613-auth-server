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

    it(`Ok. When refreshtoken is valid a new token pair should be returned.
      Status code should be 201`, async () => {
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
    {
      reason: ' Authorization header is missing',
      header: {}
    },
    {
      reason: ' Authorization header is present but undefined',
      header: {
        authorization: undefined
      }
    },
    {
      reason: ' Authorization header is present but null',
      header: {
        authorization: null
      }
    },
    {
      reason: ' Authorization header is present but token is missing',
      header: {
        authorization: 'Bearer '
      }
    },
    {
      reason: ' Authorization header is present but value is empty string',
      header: {
        authorization: ''
      }
    },
    {
      reason: 'Token is valid but header name is wrong',
      header: {
        'X-jwt-token': 'Bearer ' + refreshToken
      }
    },
    {
      reason: 'Token is valid but not perceeded with correct "bearer" keyword',
      header: {
        authorization: 'notbearer ' + refreshToken
      }
    }
  ]

  for (const header of invalidHeaders) {
    it(`Not ok, ${header.reason}  - should not return new tokens, status code should be 401.`, async () => {
      const tokenService = new TokenService()

      const req = {
        headers: header.header
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
      expect(next).to.have.been.calledWithMatch(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has('statusCode', 401))
      )
    })
  }

  it('Not ok, refresh token expired - new tokens should not be returned. Status code should be 401.', async () => {
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
    expect(next).to.have.been.calledWithMatch(
      sinon.match
        .instanceOf(Error)
        .and(sinon.match.has('statusCode', 401))
        .and(sinon.match.has('message', 'Token is invalid or expired.'))
    )
  })
})
