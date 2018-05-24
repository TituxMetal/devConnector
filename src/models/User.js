const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
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

    this.password = passwordHash
    next()
  } catch(error) {
    next(error)
  }
})

userSchema.statics.findByEmail = async email => {
  try {
    return await User.findOne({ email })
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = User = mongoose.model('users', userSchema)
