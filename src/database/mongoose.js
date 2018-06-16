const mongoose = require('mongoose')

const dbUri = process.env.NODE_ENV !== 'test' ? process.env.mongodbURI : 'mongodb://localhost:27017/devConnectorTest'

mongoose.Promise = global.Promise
mongoose.connect(dbUri)

module.exports = { mongoose }
