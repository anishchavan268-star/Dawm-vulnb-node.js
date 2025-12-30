const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const db = new sqlite3.Database('./users.db');

app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Create table
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
`);

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Serve home.html
app.get('/home.html', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

// Signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }
    
    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send("Error hashing password");
        }
        
        // Check if user already exists
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) {
                return res.status(500).send("Database error");
            }
            
            if (row) {
                return res.status(409).send("User already exists");
            }
            
            // Insert new user with hashed password
            db.run(
                "INSERT INTO users(username, password) VALUES (?, ?)",
                [username, hashedPassword],
                err => {
                    if (err) return res.status(500).send("Failed to create user");
                    res.status(201).send("Signup successful");
                }
            );
        });
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }
    
    db.get(
        "SELECT * FROM users WHERE username=?",
        [username],
        (err, row) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database error" });
            }
            
            if (row) {
                // Compare hashed password
                bcrypt.compare(password, row.password, (err, result) => {
                    if (result) {
                        res.json({ success: true, username });
                    } else {
                        res.status(401).json({ success: false, message: "Invalid login" });
                    }
                });
            } else {
                res.status(401).json({ success: false, message: "Invalid login" });
            }
        }
    );
});

// Vulnerable Login - for educational purposes only
app.post('/vuln_login', (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }
    
    // First, try to find the user with parameterized query to get the hashed password
    // This is the secure way to find the user first
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error: " + err.message });
        }
        
        if (row) {
            // If user exists, verify the password with bcrypt
            bcrypt.compare(password, row.password, (err, result) => {
                if (result) {
                    // Password matches - this is the secure way
                    res.json({ success: true, username: row.username });
                } else {
                    // Password doesn't match, but we'll also try the vulnerable approach
                    // This allows SQL injection to work as well
                    tryVulnerableLogin(req, res, username, password);
                }
            });
        } else {
            // User doesn't exist, try the vulnerable approach for SQL injection
            tryVulnerableLogin(req, res, username, password);
        }
    });
});

// Vulnerable Login 2 - specifically for UNION queries to return multiple rows
app.post('/vuln_login_union', (req, res) => {
    const { username, password } = req.body;
    
    // VULNERABLE CODE: Direct string concatenation - DO NOT USE IN PRODUCTION
    // This allows SQL injection attacks to work, especially UNION queries
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    
    // Check if this looks like a UNION-based injection that should return multiple rows
    if (query.toLowerCase().includes('union')) {
        // Execute the full query that may contain UNION to return multiple rows
        db.all(query, (err, rows) => {
            if (err) {
                // If there's an error, try a different approach
                // This handles cases where UNION structure doesn't match
                const modifiedQuery = query.replace(/SELECT \*/g, 'SELECT id, username, password');
                db.all(modifiedQuery, (err2, rows2) => {
                    if (err2) {
                        res.status(401).json({ success: false, message: "Invalid login" });
                    } else if (rows2 && rows2.length > 0) {
                        // For successful UNION queries that return multiple rows
                        // Send the first row as success but also include all rows for educational purposes
                        res.json({ 
                            success: true, 
                            username: rows2[0].username,
                            all_rows: rows2  // This allows seeing the full table
                        });
                    } else {
                        res.status(401).json({ success: false, message: "Invalid login" });
                    }
                });
            } else if (rows && rows.length > 0) {
                // For successful UNION queries that return multiple rows
                res.json({ 
                    success: true, 
                    username: rows[0].username,
                    all_rows: rows  // This allows seeing the full table
                });
            } else {
                res.status(401).json({ success: false, message: "Invalid login" });
            }
        });
    } else {
        // For non-UNION queries, use db.get as before
        db.get(query, (err, row) => {
            if (err) {
                res.status(401).json({ success: false, message: "Invalid login" });
            } else if (row) {
                res.json({ success: true, username: row.username });
            } else {
                res.status(401).json({ success: false, message: "Invalid login" });
            }
        });
    }
});

// SSRF Vulnerable Endpoint
app.get('/fetch-external', (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // VULNERABLE CODE: Direct use of user input without validation - DO NOT USE IN PRODUCTION
    // This is an SSRF vulnerability - user can make the server request any URL
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    try {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        client.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                // Send back the response from the external server
                res.json({
                    success: true,
                    data: data,
                    statusCode: response.statusCode
                });
            });
        }).on('error', (err) => {
            res.status(500).json({
                success: false,
                error: err.message
            });
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Helper function for the vulnerable query
function tryVulnerableLogin(req, res, username, password) {
    // VULNERABLE CODE: Direct string concatenation - DO NOT USE IN PRODUCTION
    // This allows SQL injection attacks to work
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    
    // Check if this looks like a UNION-based injection
    if (query.toLowerCase().includes('union')) {
        // First, try to execute with the original structure (SELECT *)
        db.all(query, (err, rows) => {
            if (err) {
                // If the original query fails, try a more generic approach
                // This might happen if the UNION doesn't match column structure
                const modifiedQuery = query.replace(/SELECT \*/g, 'SELECT username');
                db.all(modifiedQuery, (err2, rows2) => {
                    if (err2) {
                        // If still failing, try with all common columns
                        const finalQuery = query.replace(/SELECT \*/g, 'SELECT id, username, password');
                        db.all(finalQuery, (err3, rows3) => {
                            if (err3) {
                                res.status(401).json({ success: false, message: "Invalid login" });
                            } else if (rows3 && rows3.length > 0) {
                                res.json({ success: true, username: rows3[0].username });
                            } else {
                                res.status(401).json({ success: false, message: "Invalid login" });
                            }
                        });
                    } else if (rows2 && rows2.length > 0) {
                        res.json({ success: true, username: rows2[0].username });
                    } else {
                        res.status(401).json({ success: false, message: "Invalid login" });
                    }
                });
            } else if (rows && rows.length > 0) {
                // For successful UNION queries with original structure, return the first row as success
                res.json({ success: true, username: rows[0].username });
            } else {
                res.status(401).json({ success: false, message: "Invalid login" });
            }
        });
    } else {
        // For non-UNION queries, use db.get as before
        db.get(query, (err, row) => {
            if (err) {
                // Error could reveal database structure in production
                res.status(401).json({ success: false, message: "Invalid login" });
            } else if (row) {
                res.json({ success: true, username: row.username });
            } else {
                res.status(401).json({ success: false, message: "Invalid login" });
            }
        });
    }
}

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
