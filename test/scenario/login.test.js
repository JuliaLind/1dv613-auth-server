/* global after before afterEach */

import chai from 'chai'
import chaiHttp from 'chai-http'
import fs from 'fs/promises'

import { app } from '../../src/server.js'
import { UserModel } from '../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import { JwtService } from '../../src/services/JwtService.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect
chai.use(chaiHttp)

describe('scenario - login route', () => {
  const credentials = {
    password: '5up3rs3cr3tp@55w0rd',
    email: 'julia@student.lnu.se',
    birthDate: '1989-02-24'
  }

  const user = {
    ...credentials
  }
  delete user.password
  delete user.email

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

  describe('Credentials ok', async () => {
    it('Should receive access token and refresh token', async function () {
      const res = await chai.request(app)
        .post('/api/v1/login')
        .send(credentials)

      expect(res).to.have.status(201)
      expect(res.body).to.have.property('accessToken')
      expect(res.body).to.have.property('refreshToken')

      const accessPayload = await JwtService.decode(res.body.accessToken, process.env.ACCESS_TOKEN_PUBLIC_KEY)
      expect(accessPayload.user.id).to.equal(user.id)
      expect(accessPayload.user).to.not.have.property('email')
      expect(accessPayload.user).to.not.have.property('password')
      expect(accessPayload.user).to.not.have.property('birthDate')
      expect(accessPayload.user.age).to.be.a('number')

      const refreshPayload = await JwtService.decode(res.body.refreshToken, process.env.REFRESH_TOKEN_KEY)
      expect(refreshPayload).to.not.have.property('user')
      expect(refreshPayload).to.have.property('jti')

      const refreshToken = await RefreshTokenModel.findById(refreshPayload.jti)
      expect(refreshToken).to.have.property('next', null)
      expect(refreshToken).to.have.property('expired', false)
    })

    it('Should be able to have multiple active sessions', async function () {
      const res = await chai.request(app)
        .post('/api/v1/login')
        .send(credentials)

      const res2 = await chai.request(app)
        .post('/api/v1/login')
        .send(credentials)

      const refreshPayload = await JwtService.decode(res.body.refreshToken, process.env.REFRESH_TOKEN_KEY)
      const refreshPayload2 = await JwtService.decode(res2.body.refreshToken, process.env.REFRESH_TOKEN_KEY)

      const refreshToken = await RefreshTokenModel.findById(refreshPayload.jti)
      expect(refreshToken).to.have.property('next', null)
      expect(refreshToken).to.have.property('expired', false)

      const refreshToken2 = await RefreshTokenModel.findById(refreshPayload2.jti)
      expect(refreshToken2).to.have.property('next', null)
      expect(refreshToken2).to.have.property('expired', false)
    })
  })

  describe('Credentials not ok, should not receive tokens', async () => {
    const badCredentials = [
      {
        issue: 'wrong password',
        credentials: {
          email: credentials.email,
          password: 'wrongpassword'
        }
      },
      {
        issue: 'wrong email',
        credentials: {
          email: 'wrongemail',
          password: 'wrongpassword'
        }
      },
      {
        issue: 'password not provided',
        credentials: {
          email: credentials.email
        }
      },
      {
        issue: 'credentials not provided',
        credentials: {}
      }
    ]

    for (const { issue, credentials } of badCredentials) {
      it(`not ok,  ${issue}`, async function () {
        const res = await chai.request(app)
          .post('/api/v1/login')
          .send(credentials)

        expect(res).to.have.status(401)
        expect(res.body).to.not.have.property('accessToken')
        expect(res.body).to.not.have.property('refreshToken')

        expect(res.body).to.have.property('message', 'Credentials invalid or not provided.')
      })
    }
  })
})
