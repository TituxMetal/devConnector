const Joi = require('joi')

const validateBody = schema => (req, res, next) => {
  const result = Joi.validate(req.body, schema, { abortEarly: false })

  if (result.error) {
    const errors = {}
    result.error.details.map(error => {
      errors[error.path] = error.message
    })
    
    return res.status(400).json({errors})
  }

  if (!req.value) { req.value = {} }

  req.value['body'] = result.value
  next()
}

module.exports = validateBody
