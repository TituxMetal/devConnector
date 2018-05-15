const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

// Load Porfile Validation
const validateProfileInput = require('../../validation/profile')
const validateExperienceInput = require('../../validation/experience')

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
  @route    GET api/profile/handle/:handle
  @desc     Get profile by handle
  @access   Public
*/
router.get('/handle/:handle', (req, res) => {
  const errors = {}
  
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user'
        return res.status(404).json(errors)
      }

      return res.json(profile)
  }).catch(err => res.status(500).json({ server: err }))
})

/*
  @route    GET api/profile/user/:userId
  @desc     Get profile by user ID
  @access   Public
*/
router.get('/user/:userId', (req, res) => {
  const errors = {}
  
  Profile.findOne({ user: req.params.userId })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user'
        return res.status(404).json(errors)
      }

      return res.json(profile)
  }).catch(err => res.status(500).json({ server: err }))
})

/*
  @route    GET api/profile/all
  @desc     Get all profiles
  @access   Public
*/
router.get('/all', (req, res) => {
  const errors = {}

  Profile.find().populate('user', [ 'name', 'avatar' ]).then(profiles => {
    if (!profiles) {
      errors.noprofiles = 'There are no profiles'
      return res.status(404).json(errors)
    }

    return res.json(profiles)
  }).catch(err => res.status(500).json({ server: 'Something went wrong' }))
})

/*
  @route    GET api/profile
  @desc     Get current logged in users profile
  @access   Private
*/
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {}
  
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
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
  const { errors, isValid } = validateProfileInput(req.body)
  
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors)
  }

  const profileFields = {}
  profileFields.user = req.user.id

  // Standard fields
  const standardFields = ['handle', 'company', 'website', 'location', 'status', 'bio', 'githubusername']

  // Populate profileFields with standard fields received by the request
  standardFields.forEach(field => {
    if (req.body[field]) {
      profileFields[field] = req.body[field]
    }
  })
  
  // Social fields
  const socialFields = ['youtube', 'facebook', 'twitter', 'linkedin', 'instagram']

  // Populate profileFields with social fields received by the request
  socialFields.forEach(field => {
    if (req.body[field]) {
      profileFields.social[field] = req.body[field]
    }
  })

  // Split skills fields (skills are not required)
  if (typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',').map(skill => skill.trim())
  }

  Profile.findOne({ handle: profileFields.handle }).then(profile => {
    if (profile && profile.user != req.user.id) {
      errors.handle = 'That handle already exists'
      res.status(400).json(errors)
    }
    
    Profile.findOne({ user: req.user.id }).then(userProfile => {
      if (!userProfile) {
        return new Profile(profileFields).save()
          .then(profile => res.json(profile))
          .catch(err => res.status(500).json({ server: 'Something went wrong' }))
      }
      
      Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).then(profile => res.json(profile))
      .catch(err => res.status(500).json({ server: 'Something went wrong' }))
    }).catch(err => res.status(500).json({ server: 'Something went wrong' }))
  }).catch(err => res.status(500).json({ server: 'Something went wrong' }))
})

/*
  @route    POST api/profile/experience
  @desc     Add experience to profile
  @access   Private
*/
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body)
  
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors)
  }
  
  Profile.findOne({ user: req.user.id }).then(profile => {
    const newExperience = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      current: req.body.current,
      description: req.body.description,
      from: req.body.from,
      to: req.body.to
    }
    
    profile.experience.unshift(newExperience)
    profile.save()
      .then(profile => res.json(profile))
      .catch(err => res.status(500).json({ server: 'Something went wrong' }))
  }).catch(err => res.status(500).json({ server: 'Something went wrong' }))
})

module.exports = router
