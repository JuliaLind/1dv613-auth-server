/**
 * Mongoose model User.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import createError from 'http-errors'
import validator from 'validator'
import { getAge } from '../helpers/functions.js'
import { RefreshTokenModel } from './RefreshTokenModel.js'

// Restrictions

const password = {
  minLength: 8,
  maxLength: 256
}

const convertOptions = Object.freeze({
  getters: true,
  versionKey: false,
  /**
   * Removes some of the parameters when
   * transforming document into object or json.
   *
   * @param {object} doc - the original mongodb document
   * @param {object} ret - the transformed object
   * @returns {object} - the transformed object
   */
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    ret.age = getAge(ret.birthDate)

    for (const field of ['birthDate', '_id', 'password', 'email']) {
      delete ret[field]
    }

    return ret
  }
})

// Create a schema.
const schema = new mongoose.Schema(
  {
    password: {
      type: String,
      required: [true, 'Password is required.'],
      trim: true,
      minlength: [password.minLength, `Password must contain at least ${password.minLength} characters.`],
      maxlength: [password.maxLength, `Password must contain at most ${password.maxLength} characters.`]
    },

    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      unique: true,
      validate: [validator.isEmail, 'Email must be a valid email address.']
    },
    birthDate: {
      type: String,
      required: [true, 'Birth date is required.'],
      validate: {
        /**
         * Ensures the user is at least 18 years old.
         *
         * @param {string | object} value - the birth date of the user
         * @returns {boolean} - true if the user is at least 18 years old, false otherwise
         */
        validator: function (value) {
          return getAge(value) >= 18
        },
        message: 'You must be at least 18 years old.'
      }
    }
  },
  {
    timestamps: true,
    toObject: convertOptions,
    toJSON: convertOptions,
    optimisticConcurrency: false,
    versionKey: false
  }
)

/**
 * Hash the password before saving it to the database.
 * The password is hashed using bcrypt with a salt of 10 rounds.
 */
schema.pre('save', async function () {
  const saltRounds = 10

  this.email = this.email.toLowerCase().trim()
  this.password = await bcrypt.hash(this.password, saltRounds)
})

/**
 * Throws an error if the credentials are invalid or not provided.
 */
function throwWrongCredentialsError () {
  throw createError(401, 'Credentials invalid or not provided.')
}

/**
 * Throws an error if any of the mandatory fields is missing.
 *
 * @param {string} email - email of the user
 * @param {string} password - password of the user
 */
function checkMandatoryFields (email, password) {
  if (!email || !password) {
    throwWrongCredentialsError()
  }
}

/**
 * Verifies that the user exists and that the password is correct.
 *
 * @param {object} user - the user document from the database
 * @param {string} password - the password to be verified
 */
async function verify (user, password) {
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throwWrongCredentialsError()
  }
}

/**
 * Authenticates a user by comparing the passed password to the stored password hash.
 *
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {string[]} a jwt token and the refresh token.
 */
schema.statics.authenticate = async function (email, password) {
  checkMandatoryFields(email, password)

  const user = await this.findOne({ email: email.toLowerCase().trim() })

  await verify(user, password)

  return user
}

schema.pre('deleteOne', { document: true, query: false }, async function () {
  await RefreshTokenModel.expireByUser(this._id)
})

// Create a model using the schema.
export const UserModel = mongoose.model('User', schema)
