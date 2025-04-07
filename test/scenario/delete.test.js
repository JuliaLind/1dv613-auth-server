/* global beforeEach afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import chaiHttp from 'chai-http'
import fs from 'fs/promises'

import { app } from '../../src/server.js'
import { UserModel } from '../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import { TokenService } from '../../src/services/TokenService.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect
chai.use(chaiHttp)

describe('scenario - delete route', () => {
  const credentials = {
    username: 'julia_initial',
    password: '5up3rs3cr3tp@55w0rd',
    email: 'julia_initial@student.lnu.se',
    birthDate: '1989-02-24'
  }
  const user = {
    ...credentials
  }
  delete user.password

  beforeEach(async () => {
    await UserModel.create(credentials)
  })

  afterEach(async () => {
    await UserModel.deleteMany({})
    await RefreshTokenModel.deleteMany({})
  })

  afterEach(async () => {
    await RefreshTokenModel.deleteMany({})
  })

  const tokenService = new TokenService()

  describe('Should successfully delete user', async () => {
    it('Token ok, username and password ok', async function () {
      const data = await tokenService.newTokenPair(user)
      const tokens = data.tokens
      let refreshToken = tokens.refreshToken

      const res = await chai.request(app)
        .delete('/api/v1/')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({
          username: credentials.username,
          password: credentials.password
        })

      expect(res).to.have.status(204)

      const userCheck = await UserModel.findOne({ username: credentials.username })
      expect(userCheck).to.be.null
      refreshToken = await RefreshTokenModel.findById(data.jti)
      expect(refreshToken.expired).to.be.true
      expect(refreshToken.next).to.be.null
    })
  })

  describe('Should not delete user', async () => {
    it('Token ok, password not ok', async function () {
      const data = await tokenService.newTokenPair(user)
      const tokens = data.tokens
      let refreshToken = tokens.refreshToken

      const res = await chai.request(app)
        .delete('/api/v1/')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({
          username: credentials.username,
          password: 'wrong password'
        })

      expect(res).to.have.status(401)

      const userCheck = await UserModel.findOne({ username: credentials.username })
      expect(userCheck).not.to.be.null
      refreshToken = await RefreshTokenModel.findById(data.jti)
      expect(refreshToken.expired).to.be.false
      expect(refreshToken.next).to.be.null
    })
  })
})
