var sqlite3 = require('sqlite3').verbose()
var md5 = require('md5')

const DBSOURCE = "db.pyrexia"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to db')
 
    }
});

module.exports = db
