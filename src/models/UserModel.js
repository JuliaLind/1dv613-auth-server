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
import { differenceInYears, formatDate } from 'date-fns'

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
    ret.birthDate = formatDate(ret.birthDate, 'yyyy-MM-dd')
    delete ret._id
    delete ret.password
    delete ret.email
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
      type: Date,
      required: [true, 'Birth date is required.'],
      validate: {
        /**
         * Ensures the user is at least 18 years old.
         *
         * @param {string | object} value - the birth date of the user
         * @returns {boolean} - true if the user is at least 18 years old, false otherwise
         */
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
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {string[]} a jwt token and the refresh token.
 */
schema.statics.authenticate = async function (email, password) {
  if (!email || !password) {
    throwWrongCredentialsError()
  }
  const user = await this.findOne({ email })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throwWrongCredentialsError()
  }

  return user
}

// Create a model using the schema.
export const UserModel = mongoose.model('User', schema)
