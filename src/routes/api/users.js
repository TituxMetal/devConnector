const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../../passport/strategy')

const { schemas } = require('../../validation/users')
const validateRegister = require('../../middlewares/validateBody')(schemas.register)
const validateLogin = require('../../middlewares/validateBody')(schemas.login)
const UserController = require('../../controllers/api/users')
const passportJWT = passport.authenticate('jwt', { session: false })

router.post('/register', validateRegister, UserController.register)
router.post('/login', validateLogin, UserController.login)
router.get('/current', passportJWT, UserController.current)
router.get('/itWorks', UserController.itWorks)


module.exports = router
