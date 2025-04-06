// /* global afterEach */
// /* eslint-disable no-unused-expressions */

// import chai from 'chai'
// import sinon from 'sinon'
// import jwt from 'jsonwebtoken'
// import { JwtService } from '../../../src/services/JwtService.js'

// const expect = chai.expect

// describe('JwtService.encode', () => {
//   afterEach(() => {
//     sinon.restore()
//   })

//   it('should resolve with a token when jwt.sign succeeds', async () => {
//     const token = 'thisisavalidjwttoken'
//     const payload = {
//       username: 'julia'
//     }
//     const secret = 'myjwtsecret'
//     const expiresIn = '1h'

//     const jwtSign = sinon.stub(jwt, 'sign').callsFake((payload, secret, options, callback) => {
//       callback(null, token)
//     })

//     const result = await JwtService.encode(payload, secret, expiresIn)

//     expect(result).to.equal(token)
//     expect(jwtSign).to.have.been.calledOnce
//   })

//   it('should reject with an error when jwt.sign fails', async () => {
//     const error = new Error('Sign error')
//     sinon.stub(jwt, 'sign').callsFake((payload, secret, options, callback) => {
//       callback(error, null)
//     })

//     await expect(JwtService.encode({}, 'secret', '1h')).to.be.rejectedWith('Sign error')
//   })
// })
