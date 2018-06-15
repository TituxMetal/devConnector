const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../../passport/strategy')

const { schemas } = require('../../validation/post')
const validatePost = require('../../middlewares/validateBody')(schemas.post)
const PostController = require('../../controllers/api/posts')
const passportJWT = passport.authenticate('jwt', { session: false })

router.get('/', PostController.getAll)
router.post('/', passportJWT, validatePost, PostController.create)
router.post('/like/:postId', passportJWT, PostController.like)
router.delete('/:postId', passportJWT, PostController.delete)
router.get('/itWorks', PostController.itWorks)
router.get('/:postId', PostController.getId)

module.exports = router
