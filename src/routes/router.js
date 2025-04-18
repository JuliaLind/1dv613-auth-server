/**
 * Contains the main router.
 *
 * @version 1.0.0
 */
import createError from 'http-errors'
import express from 'express'
import { router as v1Router } from './api/v1/router.js'

export const router = express.Router()

router.use('/api/v1/', v1Router)

router.use((req, res, next) => {
  next(createError(404))
})
