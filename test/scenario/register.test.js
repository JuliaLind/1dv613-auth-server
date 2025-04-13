/* global after beforeEach afterEach */

import chai from 'chai'
import chaiHttp from 'chai-http'
import fs from 'fs/promises'

import { app, connection, server } from '../../src/server.js'
import { UserModel } from '../../src/models/UserModel.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

const expect = chai.expect
chai.use(chaiHttp)

describe('scenario - register route', () => {
  const credentials = {
    password: '5up3rs3cr3tp@55w0rd',
    email: 'julia_initial@student.lnu.se',
    birthDate: '1989-02-24'
  }

  const user = {
    ...credentials
  }
  delete user.password
  delete user.email

  beforeEach(async () => {
    const res = await UserModel.create(credentials)
    user.id = res._id.toString()
  })

  after(async () => {
    await connection.disconnect()
    await server.close()
  })

  afterEach(async () => {
    await RefreshTokenModel.deleteMany()
    await UserModel.deleteMany()
  })

  describe('Credentials ok', async () => {
    it('Should be able to register a new user', async function () {
      const credentials = {
        password: '5up3rs3cr3tp@55w0rd',
        email: 'julia@myemail.com',
        birthDate: '1989-02-24'
      }
      const res = await chai.request(app)
        .post('/api/v1/register')
        .send(credentials)
      expect(res).to.have.status(201)
      expect(res.body).to.have.property('id').to.be.a('string')
    })
  })

  describe('Should not be able to register same user twice', async () => {
    const badCredentials = [
      {
        issue: 'Email is already registered',
        credentials
      }
    ]
    for (const { issue, credentials } of badCredentials) {
      it('should not be able to register same user twice - ' + issue, async () => {
        const res = await chai.request(app)
          .post('/api/v1/register')
          .send(credentials)

        expect(res).to.have.status(409)
        expect(res.body).to.have.property('message', 'The email address is already registered')
      })
    }
  })

  describe('Credentials not ok', async () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 17)
    const badCredentials = [
      {
        issue: 'Too short password',
        credentials: {
          password: '',
          email: 'julia@student.lnu.se',
          birthDate: '1989-02-24'
        }
      },
      {
        issue: 'Password missing',
        credentials: {
          email: 'julia@student.lnu.se',
          birthDate: '1989-02-24'
        }
      },
      {
        issue: 'email is invalid, contains two @',
        credentials: {
          password: '5up3rs3cr3tp@55w0rd',
          email: 'julia@stud@ent.lnu.se',
          birthDate: '1989-02-24'
        }
      },
      {
        issue: 'email is missing',
        credentials: {
          password: '5up3rs3cr3tp@55w0rd',
          birthDate: '1989-02-24'
        }
      },
      {
        issue: 'user not 18',
        credentials: {
          password: '5up3rs3cr3tp@55w0rd',
          email: 'julia@student.lnu.se',
          birthDate: birthDate.toISOString()
        }
      },
      {
        issue: 'birthdate is missing',
        credentials: {
          password: '5up3rs3cr3tp@55w0rd',
          email: 'julia@student.lnu.se'
        }
      }
    ]

    for (const { issue, credentials } of badCredentials) {
      it(`not ok, ${issue}`, async function () {
        const res = await chai.request(app)
          .post('/api/v1/register')
          .send(credentials)

        expect(res).to.have.status(400)
      })
    }
  })
})
