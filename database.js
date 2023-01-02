const sqlite3 = require('sqlite3').verbose()
const dotenv = require('dotenv')

dotenv.config()

const DBFILENAME = process.env.DBFILENAME || "db.pyrexia"

let db = new sqlite3.Database(DBFILENAME, (err) => {
    if (err) {
        // cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to database file DBFILENAME='+DBFILENAME)
    }
})

// create tables if they do not exist yet
createTables()

function createTables() {
db.serialize( () => {

    db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email text UNIQUE,
        password text,
        salt text,
        token text,
        access_level INTEGER,
        CONSTRAINT email_unique UNIQUE(email)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name text,
        sensor_type text,
        addr text,
        update_time integer,
        value float,
        update_interval integer
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS sensor_types (
        sensor_type text PRIMARY_KEY,
        name text,
        hook_file text
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS controls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name text,
        min_rest INT,
        last_off_time INT,
        last_on_time INT,
        min_run INT,
        gpio INT,
        gpio_on_hi bool,
        control_on bool,
        num_cycles int,
        total_run int,
        run_capacity int
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name text,
        mode text,
        enabled bool,
        sensor_id INTEGER,
        set_point FLOAT,
        control_id INT,
        last_action text
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_id INT,
        set_point FLOAT,
        action_ts INT,
        sensor_id INT,
        sensor_value float,
        control_id INT,
        control_on bool,
        program_action TEXT,
        control_action TEXT
    )`)
})
}

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
        createTables()
    } catch(err) {
        return res.status(501).send("Nuke failed")
    }
    return next
}

module.exports = db
