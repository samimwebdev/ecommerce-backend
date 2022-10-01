const express = require('express')
const path = require('path')
require('dotenv').config()
const getRoutes = require('./routes')
const PORT = process.env.PORT || 3001

const app = express()
app.use(express.json())

app.use('/api', getRoutes())

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
