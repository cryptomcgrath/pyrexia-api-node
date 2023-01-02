// create app
var express = require("express")
var db = require("../database.js")
var md5 = require("md5")
const auth = require("../middleware/auth.js")

const router = express.Router()

var bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

function dropTables() {
    db.serialize(()=>{
        db.run('drop table if exists user')
        db.run('drop table if exists sensor_types')
        db.run('drop table if exists sensors')
        db.run('drop table if exists controls')
        db.run('drop table if exists programs')
        db.run('drop table if exists history')
    })
}

const nukeEverything = (req, res, next) => {
    try {
        dropTables()
    } catch(err) {
        return res.status(501).send("Nuke failed")
    }
    return next
}

// drop all tables
router.post("/nukeeverything", auth.verifyToken, nukeEverything, (req, res, next) => {
    res.json({"message": "Ok"})
})

// ping (unauthenticated)
router.get("/ping", (req, res, next) => {
    db.all("select count(*) as cnt from user", (err, row) => {
        if (row) {
           res.json({"message":"success","data":row})
        } else {
           res.status(500).json({"error":"unknown error counting"})
        }
    })
})

// shutdown
router.post("/shutdown", (req, res, next) => {
   require('child_process').exec('sudo /sbin/shutdown -r now', (msg) => {
       res.json({"message":"success","console":msg})
   }) 
})

module.exports = router

