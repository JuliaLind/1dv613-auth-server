// /* global after before afterEach */

// import chai from 'chai'
// import chaiHttp from 'chai-http'
// import fs from 'fs/promises'

// import { app, connection, server } from '../../src/server.js'
// import { UserModel } from '../../src/models/UserModel.js'
// import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
// import { JwtService } from '../../src/lib/JwtService.js'

// process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

// const expect = chai.expect
// chai.use(chaiHttp)

// describe('test server', () => {
//   const credentials = {
//     username: 'julia_initial',
//     password: '5up3rs3cr3tp@55w0rd',
//     email: 'julia@student.lnu.se'
//   }

//   const user = {
//     ...credentials
//   }
//   delete user.password

//   before(async () => {
//     await UserModel.create(credentials)
//   })

//   after(async () => {
//     await UserModel.deleteMany({})
//     await connection.disconnect()
//     await server.close()
//   })

//   afterEach(async () => {
//     await RefreshTokenModel.deleteMany({})
//   })

//   describe('Login route', () => {
//     describe('Credentials ok', async () => {
//       it('Should receive access token and refresh token', async function () {
//         const res = await chai.request(app)
//           .post('/api/v1/login')
//           .send(credentials)

//         expect(res).to.have.status(201)
//         expect(res.body).to.have.property('accessToken')
//         expect(res.body).to.have.property('refreshToken')

//         const accessPayload = await JwtService.decodePayload(res.body.accessToken, process.env.ACCESS_TOKEN_PUBLIC_KEY)
//         expect(accessPayload.user.username).to.equal(user.username)
//         expect(accessPayload.user.email).to.equal(user.email)
//         expect(accessPayload.user).to.not.have.property('password')

//         const refreshPayload = await JwtService.decodePayload(res.body.refreshToken, process.env.REFRESH_TOKEN_KEY)
//         expect(refreshPayload.user.username).to.equal(user.username)
//         expect(refreshPayload.user.email).to.equal(user.email)
//         expect(refreshPayload.user).to.not.have.property('password')
//         expect(refreshPayload).to.have.property('jti')

//         const refreshToken = await RefreshTokenModel.findById(refreshPayload.jti)
//         expect(refreshToken).to.have.property('next', null)
//         expect(refreshToken).to.have.property('expired', false)
//       })

//       it('Should be able to have multiple active sessions', async function () {
//         const res = await chai.request(app)
//           .post('/api/v1/login')
//           .send(credentials)

//         const res2 = await chai.request(app)
//           .post('/api/v1/login')
//           .send(credentials)

//         const refreshPayload = await JwtService.decodePayload(res.body.refreshToken, process.env.REFRESH_TOKEN_KEY)
//         const refreshPayload2 = await JwtService.decodePayload(res2.body.refreshToken, process.env.REFRESH_TOKEN_KEY)

//         const refreshToken = await RefreshTokenModel.findById(refreshPayload.jti)
//         expect(refreshToken).to.have.property('next', null)
//         expect(refreshToken).to.have.property('expired', false)

//         const refreshToken2 = await RefreshTokenModel.findById(refreshPayload2.jti)
//         expect(refreshToken2).to.have.property('next', null)
//         expect(refreshToken2).to.have.property('expired', false)
//       })
//     })

//     describe('Credentials not ok', async () => {
//       const badCredentials = [
//         {
//           issue: 'wrong password',
//           credentials: {
//             username: credentials.username,
//             password: 'wrongpassword'
//           }
//         },
//         {
//           issue: 'wrong username',
//           credentials: {
//             username: 'wrongusername',
//             password: 'wrongpassword'
//           }
//         },
//         {
//           issue: 'password not provided',
//           credentials: {
//             username: credentials.username
//           }
//         },
//         {
//           issue: 'credentials not provided',
//           credentials: {}
//         }
//       ]
//       for (const { issue, credentials } of badCredentials) {
//         it(`not ok,  ${issue}`, async function () {
//           const res = await chai.request(app)
//             .post('/api/v1/login')
//             .send(credentials)

//           expect(res).to.have.status(401)
//           expect(res.body).to.not.have.property('accessToken')
//           expect(res.body).to.not.have.property('refreshToken')

//           expect(res.body).to.have.property('message', 'Credentials invalid or not provided.')
//         })
//       }
//     })
//   })
// })
