const FileDatabase = require('./fileDatabase');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const rateLimit = require("express-rate-limit");
require('dotenv').config();

const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});



// Create an instance of FileDatabase with the desired base path
const db = new FileDatabase('database', './');

// Create a table with columns
// Check if the table already exists before creating it
if (!db.tableExists('users')) {
    // Table 'users' does not exist, so create it
    db.createTable('users', ['id', 'name', 'password', 'experience']);
} else {
    console.log("Table 'users' already exists.");
}




// Middleware to extract IP address from the request
app.use((req, res, next) => {
    // Getting the IP address from the request headers
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Storing the IP address in the request object for later use
    req.ipAddress = ipAddress;

    // Pass control to the next middleware or route handler
    next();
});

// Apply the rate limiter middleware to the specified route
app.use('/profile/:userId', limiter, async (req, res, next) => {
    try {
        // Assuming user profile images are stored in the 'static/pfp' directory
        const imagePath = path.join(__dirname, 'static', 'pfp', `${req.params.userId}.png`);

        // Read the image file asynchronously
        const image = await readFileAsync(imagePath);

        // Convert the image to base64
        const base64Image = Buffer.from(image).toString('base64');

        // Pass the base64 data to the EJS template
        res.locals.profileImageBase64 = base64Image;

        // Continue to the next middleware
        next();
    } catch (error) {
        // If there's an error reading the file or converting to base64, pass it to the error handling middleware
        next(error);
    }
});


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/request', (req, res) => {
    res.render('request-device');
});

app.get('/profile/:userId', (req, res) => {
    // Render the profile template with the provided userId
    res.render('profile', { userId: req.params.userId, base64Image: res.locals.profileImageBase64 });
});

app.get('/search', (req, res) => {
    res.render('search');
});

app.get('/compare', (req, res) => {
    res.render('compare');
});

app.get('/settings', (req, res) => {
    res.render('settings');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const errorCode = err.status || 500; // Default to 500 if no status is provided
    res.status(errorCode).render('error', { error: errorCode });
});

// Catch-all route for handling undefined routes
app.use((req, res) => {
    res.status(404).render('error', { error: 404 });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});