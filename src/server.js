const env = require('dotenv').config()
const express = require('express')

const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

const port = process.env.port || 5000

app.listen(port, () => console.log(`Server running on ${port}`))
