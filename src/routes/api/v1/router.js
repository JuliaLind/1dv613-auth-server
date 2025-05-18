/**
 * Contains the user router.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import express from 'express'
import { UserController } from '../../../controllers/UserController.js'

export const router = express.Router()

const controller = new UserController()

router.post('/login', (req, res, next) => controller.login(req, res, next))

router.post('/user', (req, res, next) => controller.register(req, res, next))

router.post('/refresh', (req, res, next) => controller.refresh(req, res, next))

router.post('/logout', (req, res, next) => controller.logout(req, res, next))

router.delete('/user', (req, res, next) => controller.delete(req, res, next))

router.get('/',
  (req, res) => {
    res.status(200).json({
      message: 'Welcome to the auth server API',
      version: '1.0.0'
    })
  })
