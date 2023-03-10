const express = require("express")
const db = require("../database.js")
const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())


router.get("/", (req, res, next) => {
    let params = [req.query.program_id, req.query.limit, req.query.offset]
    let wheresql = "where program_id = ?"
    if (req.query.end_ts > 0) {
        params = [req.query.program_id, req.query.end_ts, req.query.limit, req.query.offset]
        wheresql = "where program_id = ? and action_ts < ?"
    }
    const sql = "select * from history " + wheresql + " order by action_ts desc limit ? offset ?"
    console.log(sql)
    console.log(params.join("|"))

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": rows
        })
    })
})


router.post("/", (req, res, next) => {
    const errors = []
    if (!req.body.program_id) {
        errors.push("No program_id specified")
    }
    if (!req.body.control_id) {
        errors.push("No control_id specified")
    }
    if (!req.body.sensor_id) {
        errors.push("No sensor_id specified")
    }
    if (!req.body.sensor_value) {
        errors.push("No sensor_value specified")
    }
    if (!req.body.action_ts) {
        errors.push("No action_ts specified")
    }
    if (!req.body.program_action) {
        errors.push("No program_action specified")
    }
    if (!req.body.control_action) {
        errors.push("No control_action")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }
    const data = {
        program_id: req.body.program_id,
        set_point: req.body.set_point,
        control_id: req.body.control_id,
        sensor_id: req.body.sensor_id,
        sensor_value: req.body.sensor_value,
        control_on: req.body.control_on,
        action_ts: req.body.action_ts,
        program_action: req.body.program_action,
        control_action: req.body.control_action
    }
    const sql = `
        INSERT INTO history (
            program_id,
            set_point, 
            control_id, 
            sensor_id, 
            sensor_value, 
            control_on, 
            action_ts, 
            program_action, 
            control_action) 
        values (?,?,?,?,?,?,?,?,?)`
    const params = [
        data.program_id,
        data.set_point,
        data.control_id,
        data.sensor_id,
        data.sensor_value,
        data.control_on,
        data.action_ts,
        data.program_action,
        data.control_action]
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": data,
            "id": this.lastID
        })
    })
})

module.exports = router

