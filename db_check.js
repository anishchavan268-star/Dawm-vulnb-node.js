const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
    // Check existing tables
    console.log("Existing tables:");
    db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
        if (err) {
            console.error(err);
        } else {
            console.log(row.name);
        }
    });
    
    // Check users table structure
    setTimeout(() => {
        console.log("\nUsers table structure:");
        db.each("PRAGMA table_info(users)", (err, row) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`${row.name} - ${row.type} - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.dflt_value || 'no default'}`);
            }
        });
    }, 1000);
});

setTimeout(() => {
    db.close();
}, 2000);