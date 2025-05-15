// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000; // Change as needed

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite database with optimized settings
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1); // Exit if database connection fails
    } else {
        console.log('Connected to the SQLite database.');

        // Set PRAGMA settings for performance
        db.serialize(() => {
            db.run("PRAGMA journal_mode = WAL;");
            db.run("PRAGMA synchronous = NORMAL;");
            db.run("PRAGMA cache_size = 100000;"); // Adjust based on available memory
            db.run("PRAGMA foreign_keys = OFF;");
        });

        // Create the 'data' table with escaped 'values' column
        db.run(`
            CREATE TABLE IF NOT EXISTS data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                sensor TEXT NOT NULL,
                "values" TEXT NOT NULL
            );
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
                process.exit(1); // Exit if table creation fails
            } else {
                console.log('Table "data" is ready.');
            }
        });
    }
});

// Prepare the INSERT statement with escaped 'values' column
const insertStmt = db.prepare(`
    INSERT INTO data (timestamp, sensor, "values")
    VALUES (?, ?, ?)
`);

// Endpoint to receive sensor data
app.post('/api/sensor-data', (req, res) => {
    const { timestamp, sensor, values } = req.body;

    // Basic validation
    if (!timestamp || !sensor || !values) {
        return res.status(400).json({ error: 'Missing required fields: timestamp, sensor, values' });
    }

    // Ensure timestamp format 'YYYY-MM-DD HH:MM:SS.SSS'
    const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;
    if (!timestampRegex.test(timestamp)) {
        return res.status(400).json({ error: 'Invalid timestamp format. Expected "YYYY-MM-DD HH:MM:SS.SSS"' });
    }

    // Convert values object to JSON string
    let valuesString;
    try {
        valuesString = JSON.stringify(values);
    } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON in values field.' });
    }

    // Insert data into the database using the prepared statement
    insertStmt.run([timestamp, sensor, valuesString], function(err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.status(500).json({ error: 'Failed to store data in the database.' });
        }

        // Success response
        res.status(201).json({ message: 'Data stored successfully.', id: this.lastID });
    });
});

// Root endpoint (optional)
app.get('/', (req, res) => {
    res.send('Sensor Data API is running.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
