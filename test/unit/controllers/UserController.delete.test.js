/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { TokenService } from '../../../src/services/TokenService.js'
import { UserController } from '../../../src/controllers/UserController.js'
import { UserModel } from '../../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'
import createError from 'http-errors'

const expect = chai.expect

describe('UserController.delete', () => {
  afterEach(() => {
    sinon.restore()
  })

  const refreshToken = 'myRefreshToken'

  it(`Ok, User should be deleted when authentication passes.
    Status code should be 204.
    All active refreshtokens should be deactivated`, async () => {
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
    const user = {
      _id: {
        /**
         * Returns the id of the user as a string.
         *
         * @returns {string} The id of the user.
         */
        toString: () => '123'
      },
      deleteOne: sinon.stub().resolves()
    }
    sinon.stub(UserModel, 'authenticate').resolves(user)

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).not.to.have.been.called
    expect(res.status).to.have.been.calledWith(204)
    expect(res.json).to.not.have.been.called

    expect(user.deleteOne).to.have.been.calledOnce
  })

  it('Not Ok, User should not be deleted when authentication fails. Active refresh tokens of user should not be deactivated. Status should be 401.', async () => {
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

    sinon.stub(UserModel, 'authenticate').throws(createError(401, 'Credentials invalid or not provided.'))
    sinon.stub(RefreshTokenModel, 'expireById').resolves()

    const userController = new UserController(tokenService)

    await userController.delete(req, res, next)

    expect(next).to.have.been.calledWith(sinon.match({
      statusCode: 401,
      message: 'Credentials invalid or not provided.'
    }))
    expect(res.status).to.not.have.been.called
    expect(res.json).to.not.have.been.called
    expect(RefreshTokenModel.expireById).to.not.have.been.called
  })
})
