/* global after before afterEach */

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

describe('scenario - logout route', () => {
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

  it('Ok', async function () {
    const data = await tokenService.newTokenPair({
      id: user.id,
      age: '57'
    })
    const tokens = data.tokens

    const refreshToken = tokens.refreshToken
    const jti = data.jti

    const res = await chai.request(app)
      .post('/api/v1/logout')
      .set('Authorization', `Bearer ${refreshToken}`)
      .send()

    expect(res).to.have.status(204)

    const doc = await RefreshTokenModel.findById(jti)
    expect(doc).to.have.property('next', null)
    expect(doc).to.have.property('expired', true)
  })

  it('Not Ok, token reused', async function () {
    const data = await tokenService.newTokenPair({
      id: user.id,
      age: '57'
    })

    const refreshToken = data.tokens.refreshToken
    const jti = data.jti

    // expire the token prior to request
    let doc = await RefreshTokenModel.findById(jti)
    doc.expired = true
    doc.save()

    const res = await chai.request(app)
      .post('/api/v1/logout')
      .set('Authorization', `Bearer ${refreshToken}`)
      .send()

    expect(res).to.have.status(401)
    expect(res.body.message).to.equal('Token reuse is not allowed.')

    doc = await RefreshTokenModel.findById(jti)
    expect(doc).to.have.property('next', null)
    expect(doc).to.have.property('expired', true) // should still be expired
  })
})
