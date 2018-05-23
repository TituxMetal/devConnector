const User = require('../../models/User')

const UserController = {
  itWorks: async (req, res, next) => {
    await res.json({ msg: "Users Works" })
  },
  register: async (req, res, next) => {
    const { name, email, password } = req.value.body
    
    const foundUser = await User.findOne({ email })

    if (foundUser) {
      return res.status(400).json({ errors: { email: 'Email already exists' } })
    }

    const newUser = new User({ name, email, password })
    await newUser.save()

    res.status(200).json({ name: newUser.name, email: newUser.email })
  }
}

module.exports = UserController
