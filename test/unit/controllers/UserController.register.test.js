/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { UserModel } from '../../../src/models/UserModel.js'
import { UserController } from '../../../src/controllers/UserController.js'

const expect = chai.expect

describe('UserController.register', () => {
  afterEach(() => {
    sinon.restore()
  })

  const email = 'julia@myemail.com'
  const birthDate = '1989-02-24'
  const password = 'mypassword'

  const body = {
    email,
    birthDate,
    password
  }

  const id = '123'

  const user = {
    email,
    birthDate,
    _id: {
      /**
       * Returns the id as a string.
       *
       * @returns {string} The id as a string.
       */
      toString: () => id
    }
  }

  it('Ok, new user account should be created when valid user details are provided and the email is not previously registered. Status code should be 201.', async () => {
    sinon.stub(UserModel, 'create').resolves(user)

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController()
    await userController.register(req, res, next)

    expect(res.status).to.have.been.calledWith(201)
    expect(res.json).to.have.been.calledWith({ id })

    expect(next).not.to.have.been.called
    expect(UserModel.create).to.have.been.calledWith(body)
  })

  it('Not ok, an account is already registered with same email. Status code should be 409.', async () => {
    const error = new Error('Duplicate key error')
    error.code = 11000
    sinon.stub(UserModel, 'create').rejects(error)

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController()
    await userController.register(req, res, next)

    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called

    expect(UserModel.create).to.have.been.calledWith(body)
    expect(next).to.have.been.calledWithMatch(
      sinon.match.instanceOf(Error).and(sinon.match.has('statusCode', 409))
    )
  })

  it('Not ok, validation error - status code should be 400.', async () => {
    const error = new Error('Validation error')
    error.errors = {
      email: {
        message: 'Email is required'
      }
    }
    sinon.stub(UserModel, 'create').rejects(error)

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController()
    await userController.register(req, res, next)

    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called

    expect(UserModel.create).to.have.been.calledWith(body)
    expect(next).to.have.been.calledWithMatch(
      sinon.match.instanceOf(Error).and(sinon.match.has('statusCode', 400))
    )
  })

  it('Not ok, some other unknown error - status code should be 500.', async () => {
    const error = new Error()
    sinon.stub(UserModel, 'create').rejects(error)

    const req = {
      body
    }
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    }
    const next = sinon.stub()

    const userController = new UserController()
    await userController.register(req, res, next)

    expect(res.status).not.to.have.been.called
    expect(res.json).not.to.have.been.called

    expect(UserModel.create).to.have.been.calledWith(body)
    expect(next).to.have.been.calledWithMatch(
      sinon.match.instanceOf(Error).and(sinon.match.has('statusCode', 500))
    )
  })
})
