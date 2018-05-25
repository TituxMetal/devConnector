const express = require('express')
const router = require('express-promise-router')()

const { schemas } = require('../../validation/users')
const validateRegister = require('../../middlewares/validateBody')(schemas.register)
const validateLogin = require('../../middlewares/validateBody')(schemas.login)
const UserController = require('../../controllers/api/users')

router.post('/register', validateRegister, UserController.register)
router.post('/login', validateLogin, UserController.login)
router.get('/itWorks', UserController.itWorks)


module.exports = router
