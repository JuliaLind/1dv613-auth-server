/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import jwt from 'jsonwebtoken'
import { JwtService } from '../../../src/services/JwtService.js'

const expect = chai.expect

describe('JwtService.decode', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('Should return decoded payload when jwt.verify succeeds', async () => {
    const decoded = {
      id: 'h839fj3jg4309'
    }

    sinon.stub(jwt, 'verify').callsFake((token, key, callbackFn) => {
      callbackFn(null, decoded)
    })

    const result = await JwtService.decode('validtoken', 'secret')
    expect(result).to.deep.equal(decoded)
  })

  it('Should throw an error when jwt.verify fails', async () => {
    const error = new Error('Verify error')
    sinon.stub(jwt, 'verify').callsFake((token, key, callbackFn) => {
      callbackFn(error, null)
    })

    await expect(JwtService.decode('invalidtoken', 'secret')).to.be.rejectedWith('Verify error')
  })
})
