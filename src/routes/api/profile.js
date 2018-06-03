const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../../passport/strategy')

const { schemas } = require('../../validation/profile')
const validateProfile = require('../../middlewares/validateBody')(schemas.profile)
const ProfileController = require('../../controllers/api/profile')
const passportJWT = passport.authenticate('jwt', { session: false })

router.post('/', passportJWT, validateProfile, ProfileController.create)
router.get('/itWorks', ProfileController.itWorks)

module.exports = router
