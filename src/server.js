const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const env = require('dotenv').config()

const dbConfig = require('./database/mongoose')

const app = express()

if (!process.env.NODE_ENV === 'test') {
  app.use(morgan('dev'))
}

// Body parser middlewares
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Use Routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/profile', require('./routes/api/profile'))

module.exports = app
