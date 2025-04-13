/* global before afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import { UserModel } from '../../../src/models/UserModel.js'
import { UserController } from '../../../src/controllers/UserController.js'

const expect = chai.expect

describe('UserController.register', () => {
  before(() => {
    UserModel.deleteMany()
  })

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

  it('Ok', async () => {
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

  it('not ok, duplicate key error', async () => {
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

  it('not ok, validation error', async () => {
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
})
