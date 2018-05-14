const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')

// Load input validation
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')

// Load User Model
const User = require('../../models/User')

/*
  @route    GET api/users/test
  @desc     Tests user route
  @access   Public
*/
router.get('/test', (req, res) => res.json({ msg: "Users Works" }))

/*
  @route    POST api/users/register
  @desc     Register user
  @access   Public
*/
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body)
  const { name, email, password, password2 } = req.body
  
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors)
  }

  User.findOne({ email }).then(user => {
    if (user) {
      errors.register = 'Some fields are not valid'
      return res.status(400).json(errors)
    }

    const avatar = gravatar.url(email, {
      s: 200, // Size
      r: 'pg', // Rating
      d: 'identicon' // Default
    })
    const newUser = new User({
      name,
      email,
      password,
      avatar
    })

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) {
          throw err
        }

        newUser.password = hash
        newUser.save()
          .then(user => res.json(user))
          .catch(err => console.log(err))
      })
    })
  })
})

/*
  @route    POST api/users/login
  @desc     Login user / Returning JWT Token
  @access   Public
*/
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body)
  const { email, password } = req.body

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors)
  }

  // Find user by email
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(404).json({ auth: 'Incorrect email or password' })
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch) {
        errors.auth = 'Incorrect email or password'
        return res.status(400).json(errors)
      }

      // Create JWT Payload
      const payload = { id: user.id, name: user.name, avatar: user.avatar }
      const secretKey = process.env.secret

      // Sign Token
      jwt.sign(payload, secretKey, { expiresIn: 3600 }, (err, token) => {
        if (err) {
          return res.status(500).json({ msg: 'Internal Error' })
        }

        return res.json({ success: true, token: `Bearer ${token}` })
      })
    })
  })
})

/*
  @route    POST api/users/current
  @desc     Return current user
  @access   Private
*/
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  })
})

module.exports = router
