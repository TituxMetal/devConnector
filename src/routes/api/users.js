const express = require('express')
const router = require('express-promise-router')()

const { schemas } = require('../../validation/users')
const validateBody = require('../../middlewares/validateBody')(schemas.register)
const UserController = require('../../controllers/api/users')

router.post('/register', validateBody, UserController.register)
router.get('/itWorks', UserController.itWorks)


module.exports = router
