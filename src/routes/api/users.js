const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')

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
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: 'Email already exists' })
    }

    const avatar = gravatar.url(req.body.email, {
      s: 200, // Size
      r: 'pg', // Rating
      d: 'mm' // Default
    })
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
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
  const email = req.body.email
  const password = req.body.password

  // Find user by email
  User.findOne({ email }).then(user => {
    if (!user) {
      return res.status(404).json({ email: 'User not found' })
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch) {
        return res.status(400).json({ password: 'Password incorrect' })
      }

      // Create JWT Payload
      const payload = { id: user.id, name: user.name, avatar: user.avatar }
      const secretKey = process.env.secret

      // Sign Token
      jwt.sign(payload, secretKey, { expiresIn: 3600 }, (err, token) => {
        if (err) {
          return res.status(500).json({ msg: err })
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
