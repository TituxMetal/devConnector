const Validator = require('validator')
const isEmpty = require('./isEmpty')

const validateProfileInput = data => {
  let errors = {}
  const dataFields = ['handle', 'status', 'skills', 'bio']
  const siteUrls = ['website', 'youtube', 'twitter', 'facebook', 'linkedin', 'instagram']

  dataFields.forEach(field => {
    data[field] = !isEmpty(data[field]) ? data[field] : ''
    if (Validator.isEmpty(data[field])) {
      const fieldName = field[0].toUpperCase() + field.slice(1)
      errors[field] = `${fieldName} field is required`
    }
  })

  if (!Validator.isLength(data.handle, { min: 4, max: 40 }) && !isEmpty(data.handle)) {
    errors.handle = 'Handle needs to between 4 and 40 characters'
  }

  if (!Validator.isLength(data.bio, { min: 4 }) && !isEmpty(data.bio)) {
    errors.bio = 'Bio needs to be minimum 4 characters'
  }

  siteUrls.forEach(url => {
    if (!isEmpty(data[url]) && !Validator.isURL(data[url])) {
      errors[url] = 'Badly formatted url'
    }
  })

  return { errors, isValid: isEmpty(errors) }
}

module.exports = validateProfileInput;
