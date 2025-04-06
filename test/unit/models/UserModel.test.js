/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import bcrypt from 'bcrypt'

import { UserModel } from '../../../src/models/UserModel.js'

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
        return false
      }
      return true
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

    await expect(UserModel.authenticate(undefined, user.password)).to.be.rejectedWith('Credentials invalid or not provided.').having.property('statusCode', 401)
  })

  it('authenticate Not Ok, missing password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)
    sinon.stub(bcrypt, 'compare').callsFake((password, hash) => {
      if (password === user.password) {
        return true
      }
      return false
    })

    await expect(UserModel.authenticate(user.username, undefined)).to.be.rejectedWith('Credentials invalid or not provided.').having.property('statusCode', 401)
  })

  it('authenticate Not Ok, user not found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)

    await expect(UserModel.authenticate(user.username, user.password)).to.be.rejectedWith('Credentials invalid or not provided.').having.property('statusCode', 401)
  })

  it('authenticate Not Ok, wrong password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    await expect(UserModel.authenticate(user.username, user.password)).to.be.rejectedWith('Credentials invalid or not provided.').having.property('statusCode', 401)
  })

  describe('Create new account, not ok', () => {
    it('not yet 18', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 17)

      const user = new UserModel({
        username: 'Julia',
        email: 'julia@myemail.com',
        birthDate
      })

      await expect(user.validate()).to.be.rejectedWith('You must be at least 18 years old.')
    })

    it('Invalid email', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: 'Julia',
        email: 'julia@mye@mail.com',
        birthDate
      })

      await expect(user.validate()).to.be.rejectedWith('Email must be a valid email address.')
    })

    it('Too short username', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        username: 'aa',
        email: 'julia@myemail.com',
        birthDate
      })

      await expect(user.validate()).to.be.rejectedWith('Username must contain 3-30 characters')
    })
  })
})
