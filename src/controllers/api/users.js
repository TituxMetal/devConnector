const JWT = require('jsonwebtoken')
const User = require('../../models/User')
const JWT_SECRET = process.env.NODE_ENV === 'test' ? 'jsonwebtokensecret' : process.env.JWT_SECRET

signToken = user => {
  return JWT.sign({
    iss: 'DevConnector',
    sub: user.id,
    iat: new Date().getTime(),
    exp: new Date().setDate(new Date().getDate() + 1) // Current time + 1 day ahead
  }, JWT_SECRET)
}

const UserController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Users Works" })
  },
  register: async (req, res, next) => {
    const { name, email, password } = req.value.body
    
    const foundUser = await User.findByEmail(email)

    if (foundUser) {
      return res.status(400).json({ errors: { email: 'Email already exists' } })
    }

    const newUser = new User({ name, email, password })
    await newUser.save()

    res.status(200).json({ name: newUser.name, email: newUser.email })
  },
  login: async (req, res, next) => {
    const { email, password } = req.value.body
    
    const foundUser = await User.findByEmail(email)
    
    if (!foundUser) {
      return res.status(400).json({ errors: { auth: 'Incorrect email or password' } })
    }
    
    const isMatch = await foundUser.isValidPassword(password)

    if (!isMatch) {
      return res.status(400).json({ errors: { auth: 'Incorrect email or password' } })
    }

    const token = signToken(foundUser)
    
    res.status(200).json({ token })
  }
}

module.exports = UserController
