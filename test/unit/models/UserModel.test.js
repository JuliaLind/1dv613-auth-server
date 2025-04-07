/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import bcrypt from 'bcrypt'
import chaiAsPromised from 'chai-as-promised'

import { UserModel } from '../../../src/models/UserModel.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('UserModel', () => {
  const user = {
    username: 'julia',
    password: 'hashedpassword'
  }

  afterEach(() => {
    sinon.restore()
  })

  beforeEach(() => {
    sinon.stub(bcrypt, 'compare').callsFake((password, hash) => {
      if (password === user.password) {
        return true
      }
      return false
    })

    user.toObject = sinon.stub().returns({
      username: user.username
    })
  })

  it('authenticate OK', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    const res = await UserModel.authenticate(user.username, user.password)
    expect(res).to.deep.equal({
      username: user.username
    })
  })

  it('authenticate Not Ok, missing username', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    expect(UserModel.authenticate(undefined, user.password)).to.be.rejected.then(err => {
      expect(err).to.have.property('message', 'Credentials invalid or not provided.')
      expect(err).to.have.property('statusCode', 401)
    })
  })

  it('authenticate Not Ok, missing password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    expect(UserModel.authenticate(user.username, undefined)).to.be.rejected.then(err => {
      expect(err).to.have.property('message', 'Credentials invalid or not provided.')
      expect(err).to.have.property('statusCode', 401)
    })
  })

  it('authenticate Not Ok, user not found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)

    await expect(UserModel.authenticate(user.username, user.password)).to.be.rejected
      .then(err => {
        expect(err).to.have.property('message', 'Credentials invalid or not provided.')
        expect(err).to.have.property('statusCode', 401)
      })
  })

  it('authenticate Not Ok, wrong password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    await expect(UserModel.authenticate(user.username, 'wrong password')).to.be.rejected
      .then(err => {
        expect(err).to.have.property('message', 'Credentials invalid or not provided.')
        expect(err).to.have.property('statusCode', 401)
      })
  })

  describe('Create new account, not ok', () => {
    it('not yet 18', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 17)

      const user = new UserModel({
        username: 'Julia',
        email: 'julia@myemail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('You must be at least 18 years old.')
    })

    it('Invalid email', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: 'Julia',
        email: 'julia@mye@mail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('Email must be a valid email address.')
    })

    it('Too short username', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: 'aa',
        email: 'julia@myemail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('Username must contain at least 3 characters and begin with a letter. Username can only contain letters, numbers, underscores and hyphens.')
    })

    it('Username does not start with a letter', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: '_julia',
        email: 'julia@myemail.com',
        birthDate,
        password: 'mypassword'
      })

      expect(user.validate()).to.be.rejected
        .then(err => {
          expect(err).to.have.property('errors')
          expect(err.errors).to.have.property('username')
          expect(err.errors.username.message).to.equal(
            'Username must contain at least 3 characters and begin with a letter. Username can only contain letters, numbers, underscores and hyphens.'
          )
        })
    })

    it('Username contains invalid character', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: 'ju.lia',
        email: 'julia@myemail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('Username must contain at least 3 characters and begin with a letter. Username can only contain letters, numbers, underscores and hyphens.')
    })
  })
})
