const Joi = require('joi')

const schemas = {
  post: Joi.object().keys({
    user: Joi.string(),
    text: Joi.string().required().min(10).max(400).label('Text field').trim(),
    name: Joi.string().optional().min(4).label('Name field').trim(),
    avatar: Joi.string().optional().uri().label('Avatar field').trim()
  })
}

module.exports = { schemas }
