const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../../passport/strategy')

const { schemas } = require('../../validation/profile')
const validateProfile = require('../../middlewares/validateBody')(schemas.profile)
const validateExperience = require('../../middlewares/validateBody')(schemas.experience)
const validateEducation = require('../../middlewares/validateBody')(schemas.education)
const ProfileController = require('../../controllers/api/profile')
const passportJWT = passport.authenticate('jwt', { session: false })

router.post('/', passportJWT, validateProfile, ProfileController.create)
router.post('/experience', passportJWT, validateExperience, ProfileController.experience)
router.post('/education', passportJWT, validateEducation, ProfileController.education)
router.put('/', passportJWT, validateProfile, ProfileController.edit)
router.delete('/', passportJWT, ProfileController.delete)
router.get('/', passportJWT, ProfileController.current)
router.get('/handle/:handle', ProfileController.handle)
router.get('/user/:userId', ProfileController.user)
router.get('/all', ProfileController.all)
router.get('/itWorks', ProfileController.itWorks)

module.exports = router
