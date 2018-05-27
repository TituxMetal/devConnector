const express = require('express')
const router = require('express-promise-router')()

const ProfileController = require('../../controllers/api/profile')

router.get('/itWorks', ProfileController.itWorks)

module.exports = router
