// /* eslint-disable no-unused-expressions */

// import chai from 'chai'
// import chaiAsPromised from 'chai-as-promised'

// import { TokenService } from '../../../src/services/TokenService.js'

// import sinon from 'sinon'

// chai.use(chaiAsPromised)
// const expect = chai.expect

// describe('TokenService.expire', () => {
//   afterEach(() => {
//     sinon.restore()
//   })

//   it('OK', async function () {
//     const user = {
//       username: 'julia'
//     }
//     const jti = '456'
//     const payload = {
//       user,
//       jti
//     }

//     const tokenService = new TokenService()
//     tokenService.decodeRefreshToken = sinon.stub().resolves(payload)
//     const res = await tokenService.validate('token', user.username)
//     expect(res).to.equal(jti)
//   })

//   it('Not OK, username is not right', async function () {
//     const user = {
//       username: 'julia'
//     }
//     const jti = '456'
//     const payload = {
//       user,
//       jti
//     }

//     const tokenService = new TokenService()
//     tokenService.decodeRefreshToken = sinon.stub().resolves(payload)

//     await expect(tokenService.validate('token', 'wrongname')).to.be.rejectedWith(sinon.match({
//       statusCode: 401
//     }))
//   })
// })
