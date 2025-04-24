/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import bcrypt from 'bcrypt'
import {differenceInYears} from 'date-fns'

import { UserModel } from '../../../src/models/UserModel.js'
import mongoose from 'mongoose'
import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

const expect = chai.expect

describe('UserModel', () => {
  const user = {
    id: 'someid',
    birthDate: '1989-02-24',
    email: 'julia@lnu.com',
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
      id: user.id,
      birthDate: user.birthDate
    })
  })

  it('authenticate OK - the user object is returned when the password matched the hash', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    const res = await UserModel.authenticate(user.email, user.password)
    expect(res.toObject()).to.deep.equal({
      id: user.id,
      birthDate: user.birthDate
    })
  })

  it('authenticate Not Ok, missing password. Should throw error with status code 401.', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    expect(UserModel.authenticate(user.email, undefined)).to.be.rejected.then(err => {
      expect(err).to.have.property('message', 'Credentials invalid or not provided.')
      expect(err).to.have.property('statusCode', 401)
    })
  })

  it('authenticate Not Ok, user not found. Should throw error with status code 401.', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)

    await expect(UserModel.authenticate(user.email, user.password)).to.be.rejected
      .then(err => {
        expect(err).to.have.property('message', 'Credentials invalid or not provided.')
        expect(err).to.have.property('statusCode', 401)
      })
  })

  it('authenticate Not Ok, wrong password. Should throw error with status code 401.', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    await expect(UserModel.authenticate(user.email, 'wrong password')).to.be.rejected
      .then(err => {
        expect(err).to.have.property('message', 'Credentials invalid or not provided.')
        expect(err).to.have.property('statusCode', 401)
      })
  })

  it('The object returned by toObject method should not contain email or password. Should contain id and birth date.', async () => {
    const user = new UserModel({
      email: 'julia@mye@mail.com',
      birthDate: '1989-02-24',
      password: 'mypassword'
    })

    const obj = user.toObject()

    expect(obj).to.not.have.property('email')
    expect(obj).to.not.have.property('password')
    expect(obj).to.not.have.property('birthDate')

    expect(obj).to.have.property('id', user._id.toString())
    expect(obj).to.have.property('age', differenceInYears(new Date(), user.birthDate))
  })

  describe('Create new account', () => {
    it('Not ok,  validation should fail - user not yet 18', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 17)

      const user = new UserModel({
        email: 'julia@myemail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('You must be at least 18 years old.')
    })

    it('Not ok, validation should fail - Invalid email', async () => {
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 18)

      const user = new UserModel({
        email: 'julia@mye@mail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('Email must be a valid email address.')
    })

    it('pre save hook should hash password with 10 saltrounds', async function () {
      const passwordHash = 'hashedPassword'
      const bcryptStub = sinon.stub(bcrypt, 'hash').resolves(passwordHash)
      sinon.stub(UserModel.collection, 'insertOne').resolves({ insertedId: '123' })
      const password = 'myPassword'
      const expSaltRounds = 10

      const user = await UserModel.create({
        email: 'julia@email.com',
        birthDate: '1989-02-24',
        password
      })

      expect(bcryptStub).to.have.been.calledOnce
      expect(bcryptStub.firstCall.args[0]).to.equal(password)
      expect(bcryptStub.firstCall.args[1]).to.equal(expSaltRounds)
      expect(user.password).to.equal(passwordHash)
    })
  })

  it('pre deleteOne hook, should call RefreshTokenModel.expireByUser when a user is deleted', async () => {
    const userId = new mongoose.Types.ObjectId()
    const user = new UserModel({
      _id: userId,
      email: 'test@example.com',
      password: 'StrongPass123',
      birthDate: '1989-02-24'
    })


    sinon.stub(RefreshTokenModel, 'expireByUser').resolves()

    // replace the actual db connection
    const execStub = sinon.stub(UserModel.collection, 'deleteOne').callsFake(() => Promise.resolve({ deletedCount: 1 }))


    await user.deleteOne()

    expect(RefreshTokenModel.expireByUser).to.have.been.calledOnceWith(userId)
  })
})
