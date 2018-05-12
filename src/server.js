const env = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const users = require('./routes/api/users')
const profile = require('./routes/api/profile')
const posts = require('./routes/api/posts')

const app = express()
 // DB Config
const db = process.env.mongodbURI

// Connect to MongoDB
mongoose.connect(db)
  .then(() => console.log('MongoDB Connected'))
  .catch(error => console.log(error))

app.get('/', (req, res) => res.send('Hello World!'))

// Use Routes
app.use('/api/users', users)
app.use('/api/profile', profile)
app.use('/api/posts', posts)

const port = process.env.port || 5000

app.listen(port, () => console.log(`Server running on ${port}`))
