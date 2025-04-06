/**
 * Mongoose model User.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import createError from 'http-errors'
import validator from 'validator'
import { differenceInYears } from 'date-fns'

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
    delete ret._id
    delete ret.password
    return ret
  }
})

// Create a schema.
const schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      match: [/^[A-z][A-z0-9_-]{2,255}$/, 'Username must contain 3-256 characters and begin with a letter. Username can only contain letters, numbers, underscores and hyphens.']
    },
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
      type: Date,
      required: [true, 'Birth date is required.'],
      validate: {
        validator: function (value) {
          const age = differenceInYears(new Date(), value)
          return age >= 18
        },
        message: 'You must be at least 18 years old.'
      }
    }
  },
  {
    timestamps: true,
    toObject: convertOptions,
    toJSON: convertOptions,
    optimisticConcurrency: false
  }
)

/**
 * Hash the password before saving it to the database.
 * The password is hashed using bcrypt with a salt of 10 rounds.
 */
schema.pre('save', async function () {
  const saltRounds = 10

  this.password = await bcrypt.hash(this.password, saltRounds)
})

/**
 * Throws an error if the credentials are invalid or not provided.
 */
function throwWrongCredentialsError () {
  throw createError(401, 'Credentials invalid or not provided.')
}

/**
 * Authenticates a user by comparing the passed password to the stored password hash.
 *
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {string[]} a jwt token and the refresh token.
 */
schema.statics.authenticate = async function (username, password) {
  if (!username || !password) {
    throwWrongCredentialsError()
  }
  const user = await this.findOne({ username })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throwWrongCredentialsError()
  }

  return user.toObject()
}

// Create a model using the schema.
export const UserModel = mongoose.model('User', schema)
