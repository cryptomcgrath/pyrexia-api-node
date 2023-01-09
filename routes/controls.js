const express = require("express")
const db = require("../database.js")
const auth = require("../middleware/auth.js")

const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())


router.get("/", auth.verifyToken, (req, res, next) => {
    const sql = "select * from controls"
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

router.get("/:id", auth.verifyToken, (req, res, next) => {
    const sql = "select * from controls where id = ?"
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

router.post("/:id/on", auth.verifyToken, (req, res, next) => {
    const now_seconds = Math.floor(Date.now() / 1000)
    const data = {update_time: now_seconds}
    const params = [data.update_time, req.params.id]
    db.run(
        'UPDATE controls set last_on_time=?, control_on=1 where id=?',
        params, (err, dbresult) => {
            if (err) {
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

const getControlState = (req, res, next) => {
    const control_id = req.params.id
    const params = [control_id]
    db.get('SELECT * from controls where id=?', params, (err, row) => {
        if (err) {
            return res.status(400).json({"error": err.message})
        }
        req.control_id = control_id
        req.control_on = row["control_on"]
        req.last_on_time = row["last_on_time"]
        return next()
    })
}

router.post("/:id/off", auth.verifyToken, getControlState, (req, res, next) => {
    const max_plausible_run_time = 3600 * 3
    const update_time = Math.floor(Date.now() / 1000)
    const control_id = req.params.id
    const control_on = req.control_on
    const last_on_time = req.last_on_time
    const run_time = update_time - last_on_time
    const data = {
        control_id: control_id,
        update_time: update_time,
        control_on: control_on,
        run_time: run_time
    }
    if (control_on === 1 && last_on_time > 0 && run_time < max_plausible_run_time) {
        const params = [update_time, update_time, control_id]
        db.run(`
            UPDATE controls 
                set last_off_time=?,
                control_on=0, 
                num_cycles=num_cycles+1,
                total_run=total_run+?-last_on_time
            where id=?`, params, (err, dbresult) => {
                if (err) {
                    res.status(400).json({"error": err.message})
                    return
                }
                res.json({
                    "message": "success",
                    "data": data,
                })
            })
    } else {
        const params = [req.params.id]
        db.run(`
            UPDATE controls
                set control_on=0
            where id=?`, params, (err, dbresult) => {
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

router.post("/:id/refill", auth.verifyToken, (req, res, next) => {
    const params = [req.params.id]
    db.run(
        'UPDATE controls set num_cycles=0, total_run=0 where id=?',
        params, (err, dbresult) => {
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

router.post("/", auth.verifyToken, (req, res, next) => {
    const errors = []
    if (!req.body.name) {
        errors.push("Missing name")
    }
    if (!req.body.min_rest) {
        errors.push("Missing min_rest")
    }
    if (!req.body.min_run) {
        errors.push("Missing min_run")
    }
    if (!req.body.gpio) {
        errors.push("Missing gpio")
    }
    if (req.body.gpio_on_hi <= 0) {
        errors.push("Missing or invalid gpio_on_hi")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }
    const data = {
        name: req.body.name,
        min_rest: req.body.min_rest,
        last_off_time: 0,
        last_on_time: 0,
        min_run: req.body.min_run,
        gpio: req.body.gpio,
        gpio_on_hi: req.body.gpio_on_hi,
        run_capacity: req.body.run_capacity
    }
    const sql = `
        INSERT INTO controls (
            name,
            min_rest,
            last_off_time, 
            last_on_time, 
            min_run, 
            gpio, 
            gpio_on_hi, 
            control_on,
            num_cycles,
            total_run,
            run_capacity)
        VALUES (?,?,?,?,?,?,?,0,0,0,?)`
    const params = [
        data.name,
        data.min_rest,
        data.last_off_time,
        data.last_on_time,
        data.min_run,
        data.gpio,
        data.gpio_on_hi,
        data.run_capacity]
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

router.patch("/:id", auth.verifyToken, (req, res, next) => {
    const data = {
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
        [data.name,
            data.min_rest,
            data.min_run,
            data.gpio,
            data.gpio_on_hi,
            data.run_capacity,
            req.params.id],
        (err, result) => {
            if (err) {
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

router.delete("/:id", auth.verifyToken, (req, res, next) => {
    db.run(
        'DELETE FROM controls WHERE id = ?',
        req.params.id,
        (err, dbresult) => {
            if (err) {
                res.status(400).json({"error": res.message})
                return
            }
            res.json({"message": "deleted", changes: this.changes})
        })
})

module.exports = router

