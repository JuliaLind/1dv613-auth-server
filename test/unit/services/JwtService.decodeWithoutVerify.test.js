/* global afterEach */
/* eslint-disable no-unused-expressions */

import chai from 'chai'
import sinon from 'sinon'
import jwt from 'jsonwebtoken'
import { JwtService } from '../../../src/services/JwtService.js'

const expect = chai.expect

describe('JwtService.decodeWithoutVerify', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('Should return decoded payload from jwt.decode', async () => {
    const decoded = {
      id: 'jgrei934ut93jg0'
    }

    const decodeStub = sinon.stub(jwt, 'decode').resolves(decoded)

    const result = await JwtService.decodeWithoutVerify('myexpiredtoken')

    expect(result).to.deep.equal(decoded)
    expect(decodeStub).to.have.been.calledOnceWith('myexpiredtoken')
  })
})
