const Joi = require('joi')

const schemas = {
  profile: Joi.object().keys({
    user: Joi.string(),
    handle: Joi.string().min(3).max(40).required().label('Handle field').trim(),
    status: Joi.string().min(3).required().label('Status field').trim(),
    skills: Joi.string().min(3).required().label('Skills field').trim(),
    bio: Joi.string().min(3).required().label('Bio field').trim(),
    social: {
      facebook: Joi.string().optional().uri().label('Facebook field').trim(),
      instagram: Joi.string().optional().uri().label('Instagram field').trim(),
      linkedin: Joi.string().optional().uri().label('Linkedin field').trim(),
      twitter: Joi.string().optional().uri().label('Twitter field').trim(),
      youtube: Joi.string().optional().uri().label('Youtube field').trim()
    },
    website: Joi.string().optional().uri().label('Website field').trim(),
    location: Joi.string().optional().min(3).label('Location field').trim(),
    company: Joi.string().optional().min(3).label('Company field').trim(),
    githubaccount: Joi.string().optional().min(3).label('Githubaccount field').trim()
  }),
  experience: Joi.object().keys({
    title: Joi.string().min(3).max(40).required().label('Title field').trim(),
    location: Joi.string().min(3).max(40).optional().label('Location field').trim(),
    company: Joi.string().min(3).max(40).required().label('Company field').trim(),
    from: Joi.date().required().label('From field'),
    to: Joi.date().optional().label('To field'),
    current: Joi.boolean().optional().label('Current field'),
    description: Joi.string().min(3).optional().label('Description field').trim()
  })
}

module.exports = { schemas }
