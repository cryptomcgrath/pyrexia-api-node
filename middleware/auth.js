var db = require("../database.js")
var createError = require("http-errors")
const jwt = require("jsonwebtoken")
var crypto = require("crypto")
require("dotenv").config()

// create TOKEN_KEY if not exists in .env file
if (process.env.TOKEN_KEY == null) {
    crypto.randomBytes(48, (err, buffer) => {
        var token = buffer.toString('hex');
        process.env.TOKEN_KEY = token
    })
}

exports.checkNotAlreadyRegistered = (req, res, next) => {
  db.get("select * from user limit 1", (err, row) => {
    if (!err && !row) {
      next()
    } else {
        next(createError(403, "Not authorized"))
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
    const decoded = jwt.verify(token, process.env.TOKEN_KEY)
    req.user = decoded
  } catch (err) {
    return res.status(401).send("Invalid Token")
  }
  return next()
}

