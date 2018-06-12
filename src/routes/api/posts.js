const express = require('express')
const router = require('express-promise-router')()

const PostController = require('../../controllers/api/posts')

router.get('/itWorks', PostController.itWorks)

module.exports = router
