const express = require("express")
const db = require("../database.js")

const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())

router.get("/", (req, res, next) => {
    const sql = "select * from programs"
    const params = []
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

router.get("/run", (req, res, next) => {
    const sql = `
        SELECT 
            p.id as program_id,
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
            c.gpio_on_hi
        from 
            programs p, sensors s, controls c
        WHERE 
            p.sensor_id = s.id and
            p.control_id = c.id 
        order by 
            p.control_id, p.id`
    const params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": res.messing})
            return
        }
        res.json({
            "message": "success",
            "data": rows
        })
    })
})

router.get("/:id", (req, res, next) => {
    const sql = "select * from programs where id = ?"
    const params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": row
        })
    })
})

router.post("/:id/set", (req, res, next) => {
    const errors = []
    if (!req.body.value) {
        errors.push("Missing value")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }
    const data = {
        program_id: req.params.id,
        value: req.body.value
    }
    const params = [data.value, data.program_id]
    const sql = "update programs set set_point=? where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": data
        })
    })
})

router.post("/:id/action", (req, res, next) => {
    const errors = []
    if (!req.body.action) {
        errors.push("Missing action")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }

    const data = {
        program_id: req.params.id,
        last_action: req.body.action
    }
    const params = [data.last_action, req.params.program_id]
    const sql = "update programs set last_action=? where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        res.json({
            "message": "success",
            "data": data
        })
    })
})

router.post("/", (req, res, next) => {
    const errors = []
    if (!req.body.name) {
        errors.push("Missing name")
    }
    if (!req.body.mode) {
        errors.push("Missing mode")
    }
    if (!req.body.enabled) {
        errors.push("Missing enabled")
    }
    if (!req.body.sensor_id) {
        errors.push("Missing sensor_id")
    }
    if (!req.body.set_point) {
        errors.push("Missing set_point")
    }
    if (!req.body.control_id) {
        errors.push("Missing control_id")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }
    const data = {
        name: req.body.name,
        mode: req.body.mode,
        enabled: req.body.enabled,
        sensor_id: req.body.sensor_id,
        set_point: req.body.set_point,
        control_id: req.body.control_id
    }
    const sql = `
        INSERT INTO programs (
            name, 
            mode, 
            enabled, 
            sensor_id, 
            set_point, 
            control_id)
        VALUES (?,?,?,?,?,?)`
    const params = [data.name, data.mode, data.enabled, data.sensor_id, data.set_point, data.control_id]
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

router.patch("/:id", (req, res, next) => {
    const data = {
        name: req.body.name,
        mode: req.body.mode,
        enabled: req.body.enabled,
        sensor_id: req.body.sensor_id,
        set_point: req.body.set_point,
        control_id: req.body.control_id
    }
    db.run(
        `UPDATE programs set 
           name = COALESCE(?,name), 
           mode = COALESCE(?,mode), 
           enabled = COALESCE(?,enabled), 
           sensor_id = COALESCE(?,sensor_id),
           set_point = COALESCE(?,set_point),
           control_id = COALESCE(?, control_id)
           WHERE id = ?`,
        [data.name, data.mode, data.enabled, data.sensor_id, data.set_point, data.control_id, req.params.id],
        (err, dbresult) => {
            if (err) {
                res.status(400).json({"error": err.message})
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
        'DELETE FROM programs WHERE id = ?',
        req.params.id,
        (err, dbresult) => {
            if (err) {
                res.status(400).json({"error": err.message})
                return
            }
            res.json({"message": "deleted", changes: this.changes})
        })
})


module.exports = router

