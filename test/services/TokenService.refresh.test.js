/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fs from 'fs/promises'

import { TokenService } from '../../src/services/TokenService.js'
import { RefreshTokenModel } from '../../src/models/RefreshTokenModel.js'
import sinon from 'sinon'
import createError from 'http-errors'

chai.use(chaiAsPromised)
const expect = chai.expect

process.env.ACCESS_TOKEN_PUBLIC_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH, 'utf-8')

describe('TokenService.refresh', () => {
  afterEach(() => {
    sinon.restore()
  })

  const refreshToken = 'someRefreshToken'

  const payload = {
    user: {
      username: 'julia'
    },
    jti: '456'
  }

  it('Not Ok, refreshToken reuse', async function () {
    const tokenService = new TokenService()

    sinon.stub(tokenService, 'decodeRefreshToken').resolves(payload)
    sinon.stub(tokenService, 'createNewTokenPair')
    const errMsg = 'Token re-use is not allowed'

    const error = createError(401, errMsg)
    sinon.stub(RefreshTokenModel, 'authenticate').callsFake((jti) => {
      if (jti === payload.jti) {
        throw error
      }
    })

    await expect(tokenService.refresh(refreshToken))
      .to.be.rejectedWith(errMsg)
      .and.have.property('statusCode', 401)

    expect(tokenService.decodeRefreshToken).to.have.been.calledOnce
    expect(tokenService.createNewTokenPair).to.not.have.been.called
  })

  it('Ok', async function () {
    const tokenService = new TokenService()
    sinon.stub(tokenService, 'decodeRefreshToken').resolves(payload)
    const oldTokenDoc = {
      chain: sinon.stub().resolves()
    }
    sinon.stub(RefreshTokenModel, 'authenticate').resolves(oldTokenDoc)
    const accessToken = 'accessToken'

    sinon.stub(tokenService, 'createNewTokenPair').resolves([{
      accessToken,
      refreshToken
    }, payload.jti])

    const result = await tokenService.refresh(refreshToken)

    expect(result).to.deep.equal({
      accessToken,
      refreshToken
    })
    expect(oldTokenDoc.chain).to.have.been.calledWith(payload.jti)
  })
})
