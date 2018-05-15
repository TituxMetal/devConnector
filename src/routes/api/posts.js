const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

const Post = require('../../models/Post')
const validatePostInput = require('../../validation/post')

/*
  @route    GET api/posts/test
  @desc     Tests post route
  @access   Public
*/
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }))

/*
  @route    POST api/posts
  @desc     Create post
  @access   Private
*/
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body)
  
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors)
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  })

  newPost.save()
    .then(post => res.json(post))
    .catch(err => res.status(500).json({ server: 'Something went wrong' }))
})

module.exports = router
