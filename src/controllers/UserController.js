/**
 * Module for the UserController.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import createError from 'http-errors'
import { UserModel } from '../models/UserModel.js'
import { TokenService } from '../services/TokenService.js'

const tokenService = new TokenService()

/**
 * Encapsulates a controller.
 */
export class UserController {
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
   * @returns {void}
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
}
