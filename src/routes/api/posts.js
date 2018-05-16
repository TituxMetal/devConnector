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
  @route    GET api/posts
  @desc     Get all posts
  @access   Public
*/
router.get('/', (req, res) => {
  const errors = {}

  Post.find().sort({ date: -1 }).then(posts => {
    if (!posts) {
      errors.posts = 'There are no posts'
      return res.status(404).json(errors)
    }

    return res.json(posts)
  }).catch(err => res.status(500).json({ server: 'Something went wrong' }))
})

/*
  @route    GET api/posts/:postId
  @desc     Get post by ID
  @access   Public
*/
router.get('/:postId', (req, res) => {
  const errors = {}

  Post.findById(req.params.postId).then(post => {
    if (!post) {
      errors.nopost = 'There is no post'
      return res.status(404).json(errors)
    }

    return res.json(post)
  }).catch(err => res.status(500).json({ post: 'Invalid ID' }))
})

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
