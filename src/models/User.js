const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const gravatar = require('gravatar')
const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
})

userSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(this.password, salt)
    const avatar = gravatar.url(this.email, {
      s: 200,
      r: 'pg',
      d: 'identicon'
    })

    this.password = passwordHash
    this.avatar = avatar
    next()
  } catch(error) {
    next(error)
  }
})

userSchema.methods.isValidPassword = async function (userPassword) {
  try {
    return await bcrypt.compare(userPassword, this.password)
  } catch (error) {
    throw new Error(error)
  }
}

userSchema.statics.findByEmail = async email => {
  try {
    return await User.findOne({ email })
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = User = mongoose.model('users', userSchema)
