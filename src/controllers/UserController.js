/**
 * Module for the UserController.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import createError from 'http-errors'
import { UserModel } from '../models/UserModel.js'
import { TokenService } from '../services/TokenService.js'

/**
 * Encapsulates a controller.
 */
export class UserController {
  #tokenService
  /**
   * Creates an instance of UserController.
   *
   * @param {TokenService} tokenService - The token service to use.
   */
  constructor (tokenService = new TokenService()) {
    this.#tokenService = tokenService
  }

  /**
   * Creates a HTML error for the response
   * based on what went wrong.
   *
   * @param {Error} error - the error from the database.
   * @returns {Error} - the error to send in the response.
   */
  #createHtmlError (error) {
    if (error.code === 11000) {
      return createError(409, 'The username and/or email address is already registered')
    }

    if (error.errors) {
      return createError(400, 'The request cannot or will not be processed due to something that is perceived to be a client error (for example validation error).')
    }

    return createError(500)
  }

  /**
   * Handles registration of new user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const {
        username,
        password,
        email,
        birthDate
      } = req.body

      const userDetails = {
        username,
        password,
        email,
        birthDate
      }

      const newUser = await UserModel.create(userDetails)
      const id = newUser._id.toString()

      res.status(201).json({ id })
    } catch (error) {
      next(this.#createHtmlError(error))
    }
  }

  /**
   * Extracts the token from the request header.
   *
   * @param {object} req - Express request object.
   * @returns {string} - The extracted jwt token.
   */
  #extractToken (req) {
    const authorization = req.headers.authorization?.split(' ')

    if (this.#validateHeader(authorization)) {
      return authorization[1]
    }

    throw createError(401, 'Invalid authorization header format.')
  }

  /**
   * Validates that the token has been sent in the correct format.
   *
   * @param {string[]} authorization - The authorization header split into an array.
   * @returns {boolean} - True if the header is valid, otherwise false.
   */
  #validateHeader (authorization) {
    return Array.isArray(authorization) &&
    typeof authorization?.[0] === 'string' &&
    authorization[0].toLowerCase() === 'bearer'
  }

  /**
   * Expires the old refreshtoken and generates a new pair of
   * access token + refresh token.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async refresh (req, res, next) {
    try {
      const oldRefreshToken = this.#extractToken(req)
      const tokens = await this.#tokenService.refresh(oldRefreshToken)

      res.status(201).json(tokens)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Checks the user credentials agains db
   * and generates a new jwt token.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    const { username, password } = req.body

    try {
      // authenticate, will throw error if user does not exist or invalid password
      const user = await UserModel.authenticate(username, password)

      const result = await this.#tokenService.newTokenPair(user)

      res.status(201).json(result.tokens)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Checks the user credentials agains db
   * and generates a new jwt token.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async delete (req, res, next) {
    const { username, password } = req.body

    try {
      const refreshToken = this.#extractToken(req)
      const jti = await this.#tokenService.validate(refreshToken, username)
      await UserModel.delete(username, password)
      await this.#tokenService.expire(jti)

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}
