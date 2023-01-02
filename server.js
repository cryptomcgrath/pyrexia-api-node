// create app
const express = require("express")
const app = express()

const db = require("./database.js")
const md5 = require("md5")

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerDefinition = require('./swaggerdef.json')
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js']
}
const swaggerSpec = swaggerJSDoc(options)

const swaggerUi = require('swagger-ui-express')

const usersRouter = require('./routes/users.js')
const sensorsRouter = require('./routes/sensors.js')
const setupRouter = require('./routes/setup.js')
const controlsRouter = require('./routes/controls.js')
const programsRouter = require('./routes/programs.js')
const historyRouter = require('./routes/history.js')
const statRouter = require('./routes/stat.js')

require("dotenv").config()

// server listen
const PORT = process.env.PORT || 8000
app.listen(PORT, ()=> {
    console.log("Server running on PORT=%PORT%".replace("%PORT%", PORT))
})

// root endpoint
app.get("/", (req, res, next) => {
    res.json({"message": "Ok"})
})

app.use('/users', usersRouter)
app.use('/sensors', sensorsRouter)
app.use('/setup', setupRouter)
app.use('/controls', controlsRouter)
app.use('/programs', programsRouter)
app.use('/history', historyRouter)
app.use('/stat', statRouter)

// swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// default response for any other request
app.use((req, res) => {
    res.status(404)
})


