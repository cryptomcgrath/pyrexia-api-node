// create app
var express = require("express")
var db = require("../database.js")
var md5 = require("md5")
const auth = require("../middleware/auth.js")

const router = express.Router()

var bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

router.get("/list", auth.verifyToken, (req, res, next) => {
    var sql = `SELECT p.id as program_id,
                      p.name as program_name,
                      p.sensor_id,
                      s.name as sensor_name,
                      s.value as sensor_value,
                      s.update_time as sensor_update_time,
                      p.mode,
                      p.enabled,
                      p.set_point,
                      p.control_id,
                      c.name as control_name,
                      c.last_off_time,
                      c.last_on_time,
                      c.min_Rest,
                      c.min_run,
                      c.gpio,
                      c.gpio_on_hi,
                      c.control_on,
                      c.total_run,
                      c.run_capacity
        from programs p, sensors s, controls c
        WHERE p.sensor_id = s.id and
        p.control_id = c.id order by p.control_id, p.id`
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err){
            res.status(400).json({"error": res.messing})
            return
        }
        var now_seconds = Math.floor(Date.now() / 1000)
        res.json({
           "message":"success",
           "data":rows,
           "current_time":now_seconds
        })
    })      
})

router.get("/:id", (req, res, next) => {
    var sql = `SELECT p.id as program_id,
                      p.name as program_name,
                      p.sensor_id,
                      s.name as sensor_name,
                      s.value as sensor_value,
                      p.mode,
                      p.enabled,
                      p.set_point,
                      p.control_id,
                      c.name as control_name,
                      c.last_off_time,
                      c.last_on_time,
                      c.min_Rest,
                      c.min_run,
                      c.gpio,
                      c.gpio_on_hi,
                      c.control_on
        from programs p, sensors s, controls c
        WHERE p.sensor_id = s.id and
        p.control_id = c.id and p.id = ?`
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message})
          return
        }
        res.json({
            "message":"success",
            "data":row
        })
      })
})

router.post("/:id/increase", (req, res, next) => {
    var params = [req.params.id]
    var sql = "update programs set set_point=set_point+1 where id=?"
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success"
        })
    })
})

router.post("/:id/decrease", (req, res, next) => {
    var params =[req.params.id]
    var sql = "update programs set set_point=set_point-1 where id=?"
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success"
        })
    })
})

router.post("/:id/enable", (req, res, next) => {
    var params =[req.params.id]
    var sql = "update programs set enabled=1 where id=?"
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success"
        })
    })
})

router.post("/:id/disable", (req, res, next) => {
    var params =[req.params.id]
    var sql = "update programs set enabled=0 where id=?"
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success"
        })
    })
})



module.exports = router

