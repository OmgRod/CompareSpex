const FileDatabase = require('./fileDatabase');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
require('dotenv').config();

const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));



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




app.get('/profile/:userId', (req, res) => {
    // Render the profile template with the provided userId
    res.render('profile', { userId: req.params.userId, base64Image: res.locals.profileImageBase64 });
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

app.get('/settings/theme', (req, res) => {
    res.render('theme-settings');
});

app.get('/pricing', (req, res) => {
    res.render('pricing');
});

app.get('/legal/cookies', (req, res) => {
    res.render('cookiepolicy');
});

app.get('/more', (req, res) => {
    res.render('more');
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