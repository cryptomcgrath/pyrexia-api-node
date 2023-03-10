const express = require("express")
const db = require("../database.js")
const auth = require("../middleware/auth.js")

const router = express.Router()

const bodyParser = require("body-parser")
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())


/**
 * @swagger
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The sensor ID.
 *           example: 1
 *         name:
 *           type: string
 *           description: The sensor's name.
 *           example: living room dht22
 *         sensor_type:
 *           type: string
 *           example: dht22
 *           enum: [sp, dht2]
 *         addr:
 *           type: string
 *           description: The address of the sensor, for dht22 the gpio pin, for sp the mac address
 *           example: 6
 *
 */


/**
 * @swagger
 * /sensors:
 *   get:
 *     summary: Get all sensors
 *     description: Retrieve a list of sensors
 *     responses:
 *       200:
 *         description: Success - A list of sensors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 */
router.get("/", auth.verifyToken, (req, res, next) => {
    const sql = "select * from sensors"
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

/**
 * @swagger
 * /sensors/{id}:
 *   get:
 *     summary: Get sensor by id
 *     parameters:
 *       in: path
 *       name: id
 *       schema:
 *         type: integer
 *       required: true
 *       description: Numeric ID of the sensor to get
 *
 *     description: Retrieve the sensor with the specified id
 *     responses:
 *       200:
 *         description: Success - Sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#components/schemas/Sensor'
 */
router.get("/:id", auth.verifyToken, (req, res, next) => {
    const sql = "select * from sensors where id = ?"
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


router.post("/:id/temp", auth.verifyToken,  (req, res, next) => {
    const data = {
        sensor_id: req.params.id,
        value: req.body.value,
        update_time: req.body.update_time
    }
    db.run(
        `UPDATE sensors set
           update_time = ?,
           value = ?
           WHERE id = ?`,
        [data.update_time, data.value, data.sensor_id],
        (err, dbresult) => {
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


router.post("/", auth.verifyToken,  (req, res, next) => {
    const errors = []
    if (!req.body.name) {
        errors.push("No name specified")
    }
    if (!req.body.sensor_type) {
        errors.push("Missing sensor_type")
    }
    if (!req.body.addr) {
        errors.push("No addr specified")
    }
    if (!req.body.update_interval) {
        errors.push("Missing update_interval")
    }
    if (errors.length) {
        res.status(400).json({"error": errors.join(",")})
        return
    }
    const data = {
        name: req.body.name,
        sensor_type: req.body.sensor_type,
        addr: req.body.addr,
        update_time: 0,
        value: 0,
        update_interval: req.body.update_interval
    }
    const sql = `
        INSERT INTO sensors (
            name, 
            sensor_type, 
            addr, 
            update_time, 
            value, 
            update_interval) 
        VALUES (?,?,?,?,?,?)`
    const params = [
        data.name,
        data.sensor_type,
        data.addr,
        data.update_time,
        data.value,
        data.update_interval]
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
        sensor_type: req.body.sensor_type,
        addr: req.body.addr,
        update_time: req.body.update_time,
        value: req.body.value,
        update_interval: req.body.update_interval
    }
    db.run(
        `UPDATE sensors set 
           name = COALESCE(?,name), 
           sensor_type = COALESCE(?,sensor_type),
           addr = COALESCE(?,addr), 
           update_time = COALESCE(?,update_time),
           value = COALESCE(?,value),
           update_interval = COALESCE(?, update_interval)
           WHERE id = ?`,
        [data.name, data.sensor_type, data.addr, data.update_time, data.value, data.update_interval, req.params.id],
        (err, dbresult) => {
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
        'DELETE FROM sensors WHERE id = ?',
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

