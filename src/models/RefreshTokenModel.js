/**
 * Mongoose model RefreshToken.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import createError from 'http-errors'

/**
 * Creates a schema for the RefreshToken model.
 */
const schema = new mongoose.Schema({
  next: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', default: null },
  expired: { type: Boolean, default: false },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required.']
  }
},
{
  timestamps: true,
  versionKey: false,
  optimisticConcurrency: false
})

/**
 * Creates a document in the database
 * and returns the id of the document to be used as the jti
 * (JWT ID).
 *
 * @param {string|object} userId - the user id or user object
 * @returns { string } - The id of the created document.
 */
schema.statics.newJti = async function (userId) {
  const doc = await this.create({
    next: null,
    expired: false,
    user: userId
  })

  return doc._id.toString()
}

/**
 * Expires all tokens created from the token.
 *
 * @param {mongoose.Document} token - the token document
 */
schema.statics.expireChain = async function (token) {
  do {
    const nextId = await token.expire()

    token = await this.findById(nextId)
  } while (token)
}

/**
 * Chains old token to the new token and expires the old token.
 *
 * @param {string} newTokenId - the id of the new token document.
 */
schema.methods.chain = async function (newTokenId) {
  this.next = newTokenId
  this.expired = true
  await this.save()
}

/**
 * Authenticates a token, and returns the token document.
 *
 * @param {string} tokenId - The id of the token document.
 * @returns {Promise<object>} - The token document.
 */
schema.statics.authenticate = async function (tokenId) {
  const token = await this.findById(tokenId)

  if (token.expired) {
    // expire all tokens created from the expired refresh token
    await this.expireChain(token)

    throw createError(401, 'Token reuse is not allowed.')
  }
  return token
}

/**
 * Expires all active refresh tokens for a user.
 *
 * @param {string|object} userId - the id of a user document
 */
schema.statics.expireByUser = async function (userId) {
  const active = await this.find(
    {
      user: userId,
      expired: false
    }
  )

  console.log(`Found ${active.length} active tokens.`)

  const promises = []

  for (const token of active) {
    console.log(`Stubbing expire for token ${token._id}`)
    promises.push(token.expire())
  }
  console.log('Waiting for all expire promises to resolve...')
  await Promise.all(promises)
  console.log('All promises resolved.')
}

/**
 * Expires a token in the database after
 * finding it by id.
 *
 * @param {string} tokenId - the id of the token to expire
 */
schema.statics.expireById = async function (tokenId) {
  // will throw error if token is already expired
  const token = await this.authenticate(tokenId)

  token.expired = true
  await token.save()
}

/**
 * Expires a token in the database after
 * finding it by id.
 *
 * @returns {Promise<object>} - the ObjectId of the next token in the chain
 */
schema.methods.expire = async function () {
  if (!this.expired) {
    this.expired = true
    await this.save()
  }

  return this.next
}

export const RefreshTokenModel = mongoose.model('RefreshToken', schema)
