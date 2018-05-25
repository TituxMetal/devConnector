const Joi = require('joi')

const schemas = {
  register: Joi.object().keys({
    name: Joi.string().min(4).required().label('Name field'),
    email: Joi.string().email().required().label('Email field'),
    password: Joi.string().min(6).required().label('Password field')
  }),
  login: Joi.object().keys({
    email: Joi.string().required().label('Email field'),
    password: Joi.string().required().label('Password field')
  })
}

module.exports = { schemas }
