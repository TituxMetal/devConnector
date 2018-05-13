const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

// Load Profile Model
const Profile = require('../../models/Profile')

// Load User Model
const User = require('../../models/User')

/*
  @route    GET api/profile/test
  @desc     Tests profile route
  @access   Public
*/
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }))

/*
  @route    GET api/profile
  @desc     Get current users profile
  @access   Private
*/
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {}
  
  Profile.findOne({ user: req.user.id }).then(profile => {
    if (!profile) {
      errors.noprofile = 'There is no profile for this user'
      return res.status(404).json(errors)
    }

    return res.json(profile)
  }).catch(err => res.status(404).json(err))
})

/*
  @route    POST api/profile
  @desc     Create / Update user profile
  @access   Private
*/
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const profileFields = {}
  profileFields.user = req.user.id

  // Standard fields
  const standardFields = ['handle', 'company', 'website', 'location', 'status', 'bio', 'githubusername']

  standardFields.forEach(field => {
    if (req.body[field]) profileFields[field] = req.body[field]
  })
  
  // Social fields
  const socialFields = ['youtube', 'facebook', 'twitter', 'linkedin', 'instagram']

  socialFields.forEach(field => {
    if (req.body[field]) profileFields.social[field] = req.body[field]
  })

  // Split skills fields
  if (typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',')
  }

  Profile.findOne({ user: req.user.id }).then(profile => {
    if (profile) {
      Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).then(profile => res.json(profile))
    }

    Profile.findOne({ handle: profileFields.handle }).then(profile => {
      if (profile) {
        errors.handle = 'That handle already exists'
        return req.status(400).json(errors)
      }

      new Profile(profileFields).save().then(profile => res.json(profile))
    })
  })
})

module.exports = router
