/* global after before afterEach */

import chai from 'chai'
import fs from 'fs/promises'
import chaiHttp from 'chai-http' // must have for chai.request
import sinon from 'sinon'

import { app } from '../../src/server.js'
import { UserModel } from '../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../src/services/JwtService.js'
import { TokenService } from '../../src/services/TokenService.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect
chai.use(chaiHttp) // must have for chai.request

describe('scenario - refresh route', () => {
  const credentials = {
    password: '5up3rs3cr3tp@55w0rd',
    email: 'julia_initial@student.lnu.se',
    birthDate: '1989-02-24'
  }
  const user = {} // will contain user id (and age but age is not relevant for these tests)

  before(async () => {
    const res = await UserModel.create(credentials)
    user.id = res._id.toString()
  })

  after(async () => {
    await UserModel.deleteMany({})
  })

  afterEach(async () => {
    await RefreshTokenModel.deleteMany({})
  })

  const tokenService = new TokenService()

  describe('Token ok', async () => {
    it('Should receive new access token and new refresh token', async function () {
      const data = await tokenService.newTokenPair({
        id: user.id,
        age: '57'
      })
      const tokens = data.tokens

      const refreshToken = tokens.refreshToken
      const jti = data.jti

      const res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send()

      expect(res).to.have.status(201)
      expect(res.body).to.have.property('accessToken')
      expect(res.body).to.have.property('refreshToken')

      const accessPayload = await JwtService.decode(res.body.accessToken, process.env.ACCESS_TOKEN_PUBLIC_KEY)
      // ensure refreshed access token does not contain any additional user data
      expect(accessPayload.user.id).to.equal(user.id)
      expect(accessPayload.user).to.not.have.property('email')
      expect(accessPayload.user).to.not.have.property('birthDate')
      expect(accessPayload.user.age).to.be.a('number')

      const newRefreshTokenPayload = await JwtService.decode(res.body.refreshToken, process.env.REFRESH_TOKEN_KEY)
      expect(newRefreshTokenPayload).to.not.have.property('user')
      expect(newRefreshTokenPayload.jti).to.not.equal(jti)

      const docNew = await RefreshTokenModel.findById(newRefreshTokenPayload.jti)
      expect(docNew).to.have.property('next', null)
      expect(docNew).to.have.property('expired', false)

      // check that old token is expired and chained to the new token
      const docOld = await RefreshTokenModel.findById(jti)
      expect(docOld.next.toString()).to.equal(newRefreshTokenPayload.jti)
      expect(docOld).to.have.property('expired', true)
    })

    it('Should be able to refresh multiple times', async function () {
      const data = await tokenService.newTokenPair(user)
      let refreshToken = data.tokens.refreshToken

      let res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send()

      expect(res).to.have.status(201)

      refreshToken = res.body.refreshToken

      res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send()

      expect(res).to.have.status(201)

      refreshToken = res.body.refreshToken

      res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send()

      expect(res).to.have.status(201)
      refreshToken = res.body.refreshToken
      const payload = await JwtService.decode(refreshToken, process.env.REFRESH_TOKEN_KEY)

      const tokens = await RefreshTokenModel.find()
      for (const token of tokens) {
        // the latest token should not be expired
        if (token._id.toString() === payload.jti) {
          expect(token).to.have.property('next', null)
          expect(token).to.have.property('expired', false)
          continue
        }
        // the previous tokens should be expired and chained
        expect(token.next.toString.length).to.be.greaterThan(0)
        expect(token).to.have.property('expired', true)
      }
    })
  })

  describe('Token not ok', async () => {
    it('Reused token should expire own chain. Tokens from different session/chain should not be expired. Should not return new tokens.', async function () {
      const data = await tokenService.newTokenPair(user)
      const ses1TokenId = data.jti

      let res = await chai.request(app)
        .post('/api/v1/login')
        .send(credentials)

      // first token for the second session
      const ses2Token1 = res.body.refreshToken
      let payload = await JwtService.decode(ses2Token1, process.env.REFRESH_TOKEN_KEY)
      const ses2Token1Id = payload.jti

      res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${ses2Token1}`)
        .send()

      // second token for the second session
      const ses2Token2 = res.body.refreshToken
      payload = await JwtService.decode(ses2Token2, process.env.REFRESH_TOKEN_KEY)
      const ses2Token2Id = payload.jti

      const ses2doc1 = await RefreshTokenModel.findById(ses2Token1Id)
      expect(ses2doc1).to.have.property('expired', true)
      expect(ses2doc1.next.toString()).to.equal(ses2Token2Id)

      // newest token in second chain should of course not be expired
      let ses2doc2 = await RefreshTokenModel.findById(ses2Token2Id)
      expect(ses2doc2).to.have.property('expired', false)

      res = await chai.request(app)
        .post('/api/v1/login')
        .send(credentials)

      // token for the third session
      const ses3Token = res.body.refreshToken
      payload = await JwtService.decode(ses3Token, process.env.REFRESH_TOKEN_KEY)
      const ses3TokenId = payload.jti

      // reuse expired token
      res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bearer ${ses2Token1}`)
        .send()

      expect(res).to.have.status(401)
      expect(res.body).to.not.have.property('accessToken')
      expect(res.body).to.not.have.property('refreshToken')
      expect(res.body).to.have.property('message', 'Token reuse is not allowed.')

      // chain for session 1 should not be expired
      const ses1doc = await RefreshTokenModel.findById(ses1TokenId)
      expect(ses1doc).to.have.property('expired', false)

      // newly issued token in chain for session 2 should be expired
      ses2doc2 = await RefreshTokenModel.findById(ses2Token2Id)
      expect(ses2doc2).to.have.property('expired', true)

      // chain for session 3 should not be expired
      const ses3doc = await RefreshTokenModel.findById(ses3TokenId)
      expect(ses3doc).to.have.property('expired', false)
    })

    it('Invalid token header - should not return new tokens. Status code should be 401.', async function () {
      const data = await tokenService.newTokenPair(user)
      const refreshToken = data.tokens.refreshToken

      const res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', `Bear ${refreshToken}`) // correct is Bearer not Bear
        .send()

      expect(res).to.have.status(401)
      expect(res.body).to.have.property('message', 'Invalid authorization header format.')
      expect(res.body).to.not.have.property('accessToken')
      expect(res.body).to.not.have.property('refreshToken')
    })
  
    it('Token is expired - should not return new tokens. Status code should be 401.', async function () {
      const jti = await RefreshTokenModel.newJti(user.id)

      const payload = {
        jti,
      }
      sinon.stub(JwtService, 'decodeWithoutVerify').resolves(payload)

      const tokenExpiredError = new Error('jwt expired')
      tokenExpiredError.name = 'TokenExpiredError'
      
      sinon.stub(JwtService, 'decode').throws(tokenExpiredError)

      const res = await chai.request(app)
        .post('/api/v1/refresh')
        .set('Authorization', 'Bearer myexpiredtoken')
        .send()

      expect(res).to.have.status(401)
      expect(res.body).to.have.property('message', 'jwt expired')
      expect(res.body).to.not.have.property('accessToken')
      expect(res.body).to.not.have.property('refreshToken')
      const doc = await RefreshTokenModel.findById(jti)
      expect(doc).to.have.property('expired', true)
      expect(doc).to.have.property('next', null)
    })
  })
})
