/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import jwt from 'jsonwebtoken'
import { JwtService } from '../../src/lib/JwtService.js'

const expect = chai.expect

describe('JwtService.decodePayload', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should resolve with decoded payload when jwt.verify succeeds', async () => {
    const decoded = {
      username: 'julia'
    }

    sinon.stub(jwt, 'verify').callsFake((token, key, callbackFn) => {
      callbackFn(null, decoded)
    })

    const result = await JwtService.decodePayload('validtoken', 'secret')
    expect(result).to.deep.equal(decoded)
  })

  it('should reject with an error when jwt.verify fails', async () => {
    const error = new Error('Verify error')
    sinon.stub(jwt, 'verify').callsFake((token, key, callbackFn) => {
      callbackFn(error, null)
    })

    await expect(JwtService.decodePayload('invalidtoken', 'secret')).to.be.rejectedWith('Verify error')
  })
})
