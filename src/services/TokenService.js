/**
 * Module for the TokenService.
 * Manages the generation and validation of JWT tokens.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

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
    const jti = await RefreshTokenModel.newJti()
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
}
