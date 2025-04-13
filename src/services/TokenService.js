/**
 * Module for the TokenService.
 * Manages the generation and validation of JWT tokens.
 *
 * @author Julia Lind
 * @version 1.0.0
 */
import createError from 'http-errors'
import { RefreshTokenModel } from '../models/RefreshTokenModel.js'
import { JwtService } from './JwtService.js'

/**
 * Does the token handling.
 */
export class TokenService {
  /**
   * Generates a new access token.
   *
   * @param {object} user - associative array with user data.
   * @returns {Promise<string>} - Promise that resolves to the new access token.
   */
  async #newAccessToken (user) {
    const accessToken = await JwtService.encode({ user }, process.env.ACCESS_TOKEN_PRIVATE_KEY, process.env.ACCESS_TOKEN_LIFE)
    return accessToken
  }

  /**
   * Generates a new JWT refresh token.
   *
   * @param {object} user - associative array with user data.
   * @returns {Promise<string[]>} - Promise that resolves to the new  refresh token and the id of the refreshtoken.
   */
  async #newRefreshToken (user) {
    const jti = await RefreshTokenModel.newJti(user.id)
    const payload = {
      user,
      jti
    }
    const refreshToken = await JwtService.encode(payload, process.env.REFRESH_TOKEN_KEY, process.env.REFRESH_TOKEN_LIFE, 'HS256')

    return [refreshToken, jti]
  }

  /**
   * Generates a new token pair - jwt access token and
   * a jwt refresh token.
   *
   * @param {object} user - associative array with user data
   * @returns {object} - an associative array containing a new JWT access token and new JWT refresh token
   */
  async newTokenPair (user) {
    const accessToken = await this.#newAccessToken(user)
    const result = await this.#newRefreshToken(user)
    const [refreshToken, jti] = result

    return {
      tokens: {
        accessToken,
        refreshToken
      },
      jti
    }
  }

  /**
   * Verifies and decodes the refresh token.
   * If the token is valid its payload is returned.
   *
   * @throws 401 error if the token is invalid
   * If it's invalid because expired, the token also gets expired in the database.
   * @param {object} oldRefreshToken - the jwt refresh token
   * @returns {object} - the payload of the jwt token
   */
  async decodeRefreshToken (oldRefreshToken) {
    let payload
    try {
      payload = await JwtService.decode(oldRefreshToken, process.env.REFRESH_TOKEN_KEY)
      return payload
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        payload = await JwtService.decodeWithoutVerify(oldRefreshToken)
        await this.expire(payload.jti)
      }
      throw createError(401, error.message)
    }
  }

  /**
   * Validates and expires old refresh token, and then generates a new access token and a new refresh token.
   *
   * @param {object} oldRefreshToken - the jwt refresh token
   * @returns {object} - an associative array containing a new JWT access token and new JWT refresh token
   */
  async refresh (oldRefreshToken) {
    const payload = await this.decodeRefreshToken(oldRefreshToken)

    const oldTokenDoc = await RefreshTokenModel.authenticate(payload.jti)

    const result = await this.newTokenPair(payload.user)

    await oldTokenDoc.chain(result.jti)

    return result.tokens
  }

  /**
   * Expires the refresh token in the database.
   *
   * @param {string} jti - the id of the refresh token
   */
  async expire (jti) {
    await RefreshTokenModel.expireById(jti)
  }

  /**
   * Expires the refresh token in the database.
   *
   * @param {string} userId - the id of the refresh token
   */
  async expireByUser (userId) {
    await RefreshTokenModel.expireByUser(userId)
  }
}
