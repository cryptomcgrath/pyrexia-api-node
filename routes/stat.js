const express = require("express")
const db = require("../database.js")
const auth = require("../middleware/auth.js")

const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())

router.get("/list", auth.verifyToken, (req, res, next) => {
    const sql = `SELECT p.id as program_id,
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
    const params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": res.messing})
            return
        }
        const now_seconds = Math.floor(Date.now() / 1000)
        res.json({
            "message": "success",
            "data": rows,
            "current_time": now_seconds
        })
    })
})

const getStat = (req, res, next) => {
    const sql = `SELECT p.id as program_id,
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
                      c.control_on,
                      c.run_capacity,
                      c.total_run
        from programs p, sensors s, controls c
        WHERE p.sensor_id = s.id and
        p.control_id = c.id and p.id = ?`
    const params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message})
        }
        const now_seconds = Math.floor(Date.now() / 1000)
        row.current_time = now_seconds
        res.json({
            "message": "success",
            "data": row,
            "current_time": now_seconds
        })
    })

}

router.get("/:id", auth.verifyToken, getStat)

const increaseTemp = (req, res, next) => {
    const params = [req.params.id]
    const sql = "update programs set set_point=set_point+1 where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        next()
    })
}

const decreaseTemp = (req, res, next) => {
    const params = [req.params.id]
    const sql = "update programs set set_point=set_point-1 where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        next()
    })
}

const enableStat = (req, res, next) => {
    const params = [req.params.id]
    const sql = "update programs set enabled=1 where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        next()
    })
}

const disableStat = (req, res, next) => {
    const params = [req.params.id]
    const sql = "update programs set enabled=0 where id=?"
    db.run(sql, params, (err, dbresult) => {
        if (err) {
            res.status(400).json({"error": err.message})
            return
        }
        next()
    })
}

router.post("/:id/increase", auth.verifyToken, increaseTemp, getStat)

router.post("/:id/decrease", auth.verifyToken, decreaseTemp, getStat)

router.post("/:id/enable", auth.verifyToken, enableStat, getStat)

router.post("/:id/disable", auth.verifyToken, disableStat, getStat)


module.exports = router

