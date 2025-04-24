/* global beforeEach afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import fs from 'fs/promises'
import chaiHttp from 'chai-http' // must have for chai.request

import { app } from '../../src/server.js'
import { UserModel } from '../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import { TokenService } from '../../src/services/TokenService.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect
chai.use(chaiHttp) // must have for chai.request

describe('scenario - delete route', () => {
  const credentials = {
    password: '5up3rs3cr3tp@55w0rd',
    email: 'julia_initial@student.lnu.se',
    birthDate: '1989-02-24'
  }
  const user = {} // will contain user id (and age but age is not relevant for these tests)

  beforeEach(async () => {
    // create new user
    const res = await UserModel.create(credentials)
    user.id = res._id.toString()
  })

  afterEach(async () => {
    // cleanup
    await UserModel.deleteMany({})
    await RefreshTokenModel.deleteMany({})
  })

  const tokenService = new TokenService() // to generate tokens

  describe('Should successfully delete user', async () => {
    it('Token ok, email and password ok', async function () {
      const data = await tokenService.newTokenPair(user)

      // delete user via endpoint, requires only username and password
      const res = await chai.request(app)
        .delete('/api/v1/')
        .send({
          email: credentials.email,
          password: credentials.password
        })

      expect(res).to.have.status(204)

      const userCheck = await UserModel.findOne({ email: credentials.email })
      expect(userCheck).to.be.null // user should not exist
      const refreshToken = await RefreshTokenModel.findById(data.jti)
      expect(refreshToken.expired).to.be.true // refresh token should be expired
      expect(refreshToken.next).to.be.null // no new token created
    })
  })

  describe('Should not delete user', async () => {
    it('Password not ok', async function () {
      const data = await tokenService.newTokenPair(user)

      const res = await chai.request(app)
        .delete('/api/v1/')
        .send({
          email: credentials.email,
          password: 'wrong password'
        })

      expect(res).to.have.status(401)

      const userCheck = await UserModel.findOne({ email: credentials.email })
      expect(userCheck).not.to.be.null // user should still exist
      const refreshToken = await RefreshTokenModel.findById(data.jti)
      expect(refreshToken.expired).to.be.false // token should not be expired
      expect(refreshToken.next).to.be.null // no new token created
    })
  })
})
