const app = require('./server')

const port = process.env.port || 5000

app.listen(port)

console.log(`Server listening on port ${port}`)
