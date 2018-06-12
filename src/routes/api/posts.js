const express = require('express')
const router = require('express-promise-router')()

const PostController = require('../../controllers/api/posts')

router.get('/', PostController.getAll)
router.get('/itWorks', PostController.itWorks)
router.get('/:postId', PostController.getId)

module.exports = router
