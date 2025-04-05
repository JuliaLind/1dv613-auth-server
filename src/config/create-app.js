/**
 * Creates an Express app with all the configurations.
 *
 * @author Julia Lind
 * @version 1.0.0
 */
import express from 'express'
import helmet from 'helmet'
import logger from 'morgan'
import cors from 'cors'
import createError from 'http-errors'
import { router } from '../routes/router.js'

/**
 * Creates a new app instance with all the
 * configurations.
 *
 * @returns {object} The app instance.
 */
export function createApp () {
  const app = express()

  // use helmet for security
  app.use(helmet())

  // Enable Cross Origin Resource Sharing (CORS) (https://www.npmjs.com/package/cors).
  app.use(cors())
  app.use(express.json())
  app.use(logger('dev'))

  app.use('/', router)

  // Error handler.
  app.use(function (err, req, res, next) {
    if (createError.isHttpError(err)) {
      return res
        .status(err.status)
        .json({
          status_code: err.status,
          message: err.message
        })
    }

    // 500 Internal Server Error (in production, all other errors send this response).
    if (req.app.get('env') !== 'development') {
      return res
        .status(500)
        .json({
          status_code: 500,
          message: 'An unexpected condition was encountered.'
        })
    }

    // Development only!
    // Only providing detailed error in development.
    res
      .status(err.status || 500)
      .json({
        status_code: err.status || 500,
        message: err.message,
        stack: err.stack
      })
  })

  return app
}
