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
    id: 'someid',
    birthDate: '1989-02-24',
    email: 'julia@lnu.com',
    password: 'hashedpassword'
  }

  afterEach(() => {
    sinon.restore()
    UserModel.deleteMany()
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

  it('authenticate OK', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    const res = await UserModel.authenticate(user.email, user.password)
    expect(res.toObject()).to.deep.equal({
      id: user.id,
      birthDate: user.birthDate
    })
  })

  it('authenticate Not Ok, missing password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    expect(UserModel.authenticate(user.email, undefined)).to.be.rejected.then(err => {
      expect(err).to.have.property('message', 'Credentials invalid or not provided.')
      expect(err).to.have.property('statusCode', 401)
    })
  })

  it('authenticate Not Ok, user not found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)

    await expect(UserModel.authenticate(user.email, user.password)).to.be.rejected
      .then(err => {
        expect(err).to.have.property('message', 'Credentials invalid or not provided.')
        expect(err).to.have.property('statusCode', 401)
      })
  })

  it('authenticate Not Ok, wrong password', async () => {
    sinon.stub(UserModel, 'findOne').resolves(user)

    await expect(UserModel.authenticate(user.email, 'wrong password')).to.be.rejected
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
        email: 'julia@mye@mail.com',
        birthDate,
        password: 'mypassword'
      })

      await expect(user.validate()).to.be.rejectedWith('Email must be a valid email address.')
    })

    it('toObject', async () => {
      const user = new UserModel({
        email: 'julia@mye@mail.com',
        birthDate: '1989-02-24',
        password: 'mypassword'
      })

      const obj = user.toObject()

      expect(obj).to.not.have.property('email')
      expect(obj).to.not.have.property('password')
      expect(obj).to.have.property('birthDate', '1989-02-24')
      expect(obj).to.have.property('id', user._id.toString())
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
})
