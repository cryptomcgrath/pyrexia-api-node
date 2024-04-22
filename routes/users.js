const express = require("express")
const db = require("../database.js")
const validator = require("email-validator")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')

require('dotenv').config()

const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

const auth = require("../middleware/auth.js")

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login 
 *     description: Obtain token using email and password to login
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 */
router.post("/login", (req, res) => {
    try {
        const { email, password } = req.body
        if (!(email && password)) {
            res.status(400).send("All input is required")
        }

        let user = []
        const sql = "SELECT * FROM user WHERE email = ?"
        db.all(sql, email, (err, rows) => {
            if (err){
                res.status(400).json({"error": err.message})
                return
            }
            rows.forEach(function (row) {
                user.push(row)
            })
            const userPassHash = bcrypt.hashSync(password, user[0].salt)
            if (userPassHash === user[0].password) {
                const token = jwt.sign(
                    { user_id: user[0].Id, email },
                      process.env.TOKEN_KEY,
                    {
                      expiresIn: "365d", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                    }
                )
                user[0].token = token
            } else {
                return res.status(400).send("No Match")
            }
            return res.status(200).send(user[0])
        })
    } catch (err) {
      console.log(err)
    }    
})


router.post("/register", auth.checkNotAlreadyRegistered, (req, res, next) => {
    const errors=[]
    if (!req.body.password){
        errors.push("No password specified")
    }
    if (!req.body.email){
        errors.push("No email specified")
    }
    if (!validator.validate(req.body.email)) {
        errors.push("Invalid email address")
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")})
        return
    }
    const salt = bcrypt.genSaltSync(10)

    // access level
    let access_level
    if (req.body.admin) {
        access_level = 9
    } else {
        access_level = 1
    }
    const data = {
        email: req.body.email.toLowerCase(),
        salt: salt,
        password : bcrypt.hashSync(req.body.password, salt),
        access_level: access_level
    }

    // add the user
    const sql ='INSERT INTO user (email, password, salt, access_level) VALUES (?,?,?,?)'
    const params =[data.email, data.password, data.salt, data.access_level]
    db.run(sql, params, (err, dbresult) => {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    })
})

router.post("/test", auth.verifyToken, (req, res) => {
    res.status(200).send("Valid Token!")
})

module.exports = router
