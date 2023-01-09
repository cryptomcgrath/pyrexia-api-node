const db = require("../database.js")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

require("dotenv").config()

// create TOKEN_KEY if not exists in .env file
if (process.env.TOKEN_KEY == null) {
    crypto.randomBytes(48, (err, buffer) => {
        process.env.TOKEN_KEY = buffer.toString('hex')
        console.log('Using new random generated TOKEN_KEY in memory')
    })
}

// only allows 1 admin user (pyrexia-stat client)
// and 1 non-admin user (pyrexia-android client)
exports.checkNotAlreadyRegistered = (req, res, next) => {
    let sql = "select * from user where access_level is not 9 limit 1"
    if (req.body.admin) {
        sql = "select * from user where access_level=9 limit 1"
    }
    db.get(sql, (err, row) => {
        if (!err && !row) {
            next()
        } else {
            return res.status(403).send("Not authorized")
        }
    })
}


exports.verifyToken = (req, res, next) => {
    const token =
        req.body.token || req.query.token || req.headers["x-access-token"]

    if (!token) {
        return res.status(403).send("A token is required for authentication")
    }
    try {
        req.user = jwt.verify(token, process.env.TOKEN_KEY)
    } catch (err) {
        return res.status(401).send("Invalid Token")
    }
    return next()
}
