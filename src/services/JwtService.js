/**
 * Contains the JsonWebToken class.
 *
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'

/**
 * Exposes methods for working with JSON Web Tokens (JWTs).
 */
export class JwtService {
  /**
   * Encodes user information into a JSON Web Token (JWT) payload.
   *
   * @param {object} payload - the payload of the JWT.
   * @param {string} secret - The secret key used for signing the JWT.
   * @param {string|number} expiresIn - The expiration time for the JWT, specified in seconds or as a string describing a time span (e.g., '1d', '2h') using the vercel/ms library.
   * @param {string} algorithm - the alogrithm to use for signing the JWT - default is RS256 for assymetric key.
   * @returns {Promise<string>} A Promise that resolves to the generated JWT.
   */
  static async encode (payload, secret, expiresIn, algorithm = 'RS256') {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        secret,
        {
          algorithm,
          expiresIn
        },
        (error, token) => {
          if (error) {
            reject(error)
            return
          }

          resolve(token)
        }
      )
    })
  }

  /**
   * Decodes a JWT and returns the payload.
   *
   * @param {string} token - The JWT to decode.
   * @param {string} key - The secret key used for verifying the JWT.
   * @returns {Promise<object>} A Promise that resolves to the payload extracted from the JWT payload.
   */
  static async decode (token, key) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, key, (error, decoded) => {
        if (error) {
          reject(error)
          return
        }

        resolve(decoded)
      })
    })
  }

  /**
   * Decodes a token without verifying it.
   * Used to get the jti from the refresh token after it has expired, to
   * mark as expired in the database and to check for reuse.
   *
   * @param {string} token - The JWT to decode.
   * @returns {object} The payload extracted from the JWT payload.
   */
  static async decodeWithoutVerify (token) {
    return jwt.decode(token)
  }
}
