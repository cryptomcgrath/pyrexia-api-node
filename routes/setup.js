// create app
var express = require("express")
var db = require("../database.js")
var md5 = require("md5")

const router = express.Router()

var bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

// create database
router.post("/init", (req, res, next) => {
    db.serialize(()=>{
        // users
        db.run('drop table if exists user')
        db.run('CREATE TABLE user ( id INTEGER PRIMARY KEY AUTOINCREMENT, email text UNIQUE, password text, salt text, token text, access_level INTEGER, CONSTRAINT email_unique UNIQUE(email))')
       
        // sensor types 
        db.run('drop table if exists sensor_types')
        db.run('CREATE TABLE sensor_types (sensor_type text PRIMARY_KEY, name text, hook_file text)')
        var insert = 'INSERT INTO sensor_types (sensor_type, name, hook_file) VALUES (?,?,?)'
        db.run(insert, ['sp', 'SensorPush HW.t Bluetooth Sensor', 'sp_sensor_hook.py'])
        db.run(insert, ['dht22', 'DHT22 Temperature Sensor', 'dht_sensor_hook.py'])

        // sensors
        db.run('drop table if exists sensors')
        db.run('CREATE TABLE sensors (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, sensor_type text, addr text, update_time integer, value float, update_interval integer)')

        // controls
        db.run('drop table if exists controls')
        db.run('CREATE TABLE controls (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, min_rest INT, last_off_time INT, last_on_time INT, min_run INT, gpio INT, gpio_on_hi bool, control_on bool, num_cycles int, total_run int, run_capacity int)')

        // programs
        db.run('drop table if exists programs')
        db.run('CREATE TABLE programs (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, mode text, enabled bool, sensor_id INTEGER, set_point FLOAT, control_id INT, last_action text)') 	

        // history
        db.run('drop table if exists history')
        db.run('CREATE TABLE history (id INTEGER PRIMARY KEY AUTOINCREMENT, program_id INT, set_point FLOAT, action_ts INT, sensor_id INT, sensor_value float, control_id INT, control_on bool, program_action TEXT, control_action TEXT)')

        res.json({"message": "Ok"})
    })

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

