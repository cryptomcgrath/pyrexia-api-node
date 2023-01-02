// create app
var express = require("express")
var db = require("../database.js")
var md5 = require("md5")

const router = express.Router()

var bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())


router.get("/", (req, res, next) => {
    var sql = "select * from controls"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message})
            return
        }
        res.json({
            "message":"success",
            "data":rows
        })
    })
})

router.get("/:id", (req, res, next) => {
    var sql = "select * from controls where id = ?"
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
 
router.post("/:id/on", (req, res, next) => {
    var now_seconds = Math.floor(Date.now() / 1000)
    var data = { update_time: now_seconds }
    var params = [data.update_time, req.params.id]
    db.run(
        'UPDATE controls set last_on_time=?, control_on=1 where id=?',
        params, function (err, result) {
            if (err){
                res.status(400).json({"error": err.message})
                return
            }
            res.json({
                "message": "success",
                "data": data,
            })
        }
    )
})

router.post("/:id/off", (req, res, next) => {
    var now_seconds = Math.floor(Date.now() / 1000)
    var data = { update_time: now_seconds }
    var params = [data.update_time, data.update_time, req.params.id]
    db.get('SELECT * from controls where id=?', [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        var control_on = row["control_on"]
        var last_on_time = row["last_on_time"]
        var run_time = data.update_time - last_on_time
        
        if (control_on == 1 && last_on_time > 0 && run_time < 3600*3) {
            db.run('UPDATE controls set last_off_time=?, control_on=0, num_cycles=num_cycles+1, total_run=total_run+?-last_on_time where id=?', params, (err, result) => {
                if (err){
                    res.status(400).json({"error": err.message})
                    return
                }
                res.json({
                    "message": "success",
                    "data": data,
                })
            })
        } else {
            db.run('UPDATE controls set last_off_time=?, control_on=0', params, (err, result) => {
                if (err) {
                    res.status(400).json({"error": err.message})
                    return
                }
                res.json({
                    "message": "success",
                    "data": data,
                })
            })
        }

    })
})

router.post("/:id/initoff", (req, res, next) => {
    var params = [data.update_time, req.params.id]
    db.run(
        'UPDATE controls set last_off_time=?, control_on=0 where id=?',
        params, (err, result) => {
            if (err){
                res.status(400).json({"error": err.message})
                return
            }
            res.json({
                "message": "success",
                "data": data,
            })
        }
    )
})

router.post("/:id/refill", (req, res, next) => {
    var params = [req.params.id]
    db.run(
        'UPDATE controls set num_cycles=0, total_run=0 where id=?',
        params, (err, result) => {
            if (err) {
                res.status(400).json({"error": err.message})
                return
            }
            res.json({
                "message": "success"
            })
        }
    )
})

router.post("/", (req, res, next) => {
    var errors=[]
    if (!req.body.name){
        errors.push("Missing name")
    }
    if (!req.body.min_rest){
        errors.push("Missing min_rest")
    }
    if (!req.body.min_run){
        errors.push("Missing min_run")
    }
    if (!req.body.gpio){
        errors.push("Missing gpio")
    }
    if (req.body.gpio_on_hi <= 0){
        errors.push("Missing or invalid gpio_on_hi")
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")})
        return
    }
    var data = {
        name: req.body.name,
        min_rest: req.body.min_rest,
        last_off_time: 0, 
        last_on_time: 0,
        min_run: req.body.min_run,
        gpio: req.body.gpio,
        gpio_on_hi: req.body.gpio_on_hi,
        run_capacity: req.body.run_capacity
    }
    var sql ='INSERT INTO controls (name, min_rest, last_off_time, last_on_time, min_run, gpio, gpio_on_hi, control_on,num_cycles,total_run,run_capacity) VALUES (?,?,?,?,?,?,?,0,0,0,?)'
    var params =[data.name, data.min_rest, data.last_off_time, data.last_on_time, data.min_run, data.gpio, data.gpio_on_hi, data.run_capacity]
    db.run(sql, params, function (err, result) {
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

router.patch("/:id", (req, res, next) => {
    var data = {
        name: req.body.name,
        min_rest: req.body.min_rest,
        min_run: req.body.min_run,
        gpio: req.body.gpio,
        gpio_on_hi: req.body.gpio_on_hi,
        run_capacity: req.body.run_capacity
    }
    db.run(
        `UPDATE controls set 
           name = COALESCE(?,name), 
           min_rest = COALESCE(?,min_rest), 
           min_run = COALESCE(?,min_run),
           gpio = COALESCE(?,gpio),
           gpio_on_hi = COALESCE(?,gpio_on_hi),
           run_capacity = COALESCE(?,run_capacity)
           WHERE id = ?`,
        [data.name, data.min_rest, data.min_run, data.gpio, data.gpio_on_hi, data.run_capacity, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    })
})

router.delete("/:id", (req, res, next) => {
    db.run(
        'DELETE FROM controls WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return
            }
            res.json({"message":"deleted", changes: this.changes})
    })
})


module.exports = router

