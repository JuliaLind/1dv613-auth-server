// /* global afterEach */
// /* eslint-disable no-unused-expressions */

// import chai from 'chai'
// import sinon from 'sinon'

// import { RefreshTokenModel } from '../../../src/models/RefreshTokenModel.js'

// const expect = chai.expect

// describe('RefreshTokenModel', () => {
//   afterEach(() => {
//     sinon.restore()
//   })

//   it('newJti', async () => {
//     const refreshTokenDoc = {
//       _id: {
//         /**
//          * Returns the stringified id of the token.
//          *
//          * @returns {string} The stringified id of the token.
//          */
//         toString: () => '123'
//       }
//     }

//     sinon.stub(RefreshTokenModel, 'create').resolves(refreshTokenDoc)

//     const jti = await RefreshTokenModel.newJti()
//     expect(jti).to.equal('123')
//     expect(RefreshTokenModel.create).to.have.been.calledOnce
//   })

//   it('authenticate OK', async () => {
//     RefreshTokenModel.expireChain = sinon.stub().resolves()
//     const token = {
//       expired: false
//     }
//     RefreshTokenModel.findById = sinon.stub().resolves(token)

//     const res = await RefreshTokenModel.authenticate('456')
//     expect(res).to.equal(token)
//   })

//   it('authenticate Not OK', async () => {
//     RefreshTokenModel.expireChain = sinon.stub().resolves()
//     const token = {
//       expired: true
//     }
//     RefreshTokenModel.findById = sinon.stub().resolves(token)

//     await expect(RefreshTokenModel.authenticate('456')).to.be.rejectedWith('Token expired')
//   })

//   it('expireById OK', async () => {
//     const token = {
//       expire: sinon.stub().resolves(null)
//     }
//     sinon.stub(RefreshTokenModel, 'findById').resolves(token)

//     await RefreshTokenModel.expireById('456')
//     expect(token.expire).to.have.been.calledOnce
//   })

//   it('expireChain OK', async () => {
//     const token3 = {
//       _id: {
//         /**
//          * Returns the stringified id of the token.
//          *
//          * @returns {string} The stringified id of the token.
//          */
//         toString: () => '789'
//       },
//       expire: sinon.stub().resolves(null)
//     }

//     const token2 = {
//       _id: {
//         /**
//          * Returns the stringified id of the token.
//          *
//          * @returns {string} The stringified id of the token.
//          */
//         toString: () => '456'
//       },
//       expire: sinon.stub().resolves(token3._id)
//     }

//     const token1 = {
//       expire: sinon.stub().resolves(token2._id)
//     }
//     sinon.stub(RefreshTokenModel, 'findById').callsFake((id) => {
//       if (id === token2._id) return token2
//       if (id === token3._id) return token3
//     })

//     await RefreshTokenModel.expireChain(token1)
//     expect(token1.expire).to.have.been.calledOnce
//     expect(token2.expire).to.have.been.calledOnce
//     expect(token3.expire).to.have.been.calledOnce
//   })
// })
