const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to extract IP address from the request
app.use((req, res, next) => {
    // Getting the IP address from the request headers
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Storing the IP address in the request object for later use
    req.ipAddress = ipAddress;
    
    // Pass control to the next middleware or route handler
    next();
  });

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/request', (req, res) => {
    res.render('request-device');
});

app.get('/profile', (req, res) => {
    res.render('profile');
});

app.get('/search', (req, res) => {
    res.render('search');
});

app.get('/compare', (req, res) => {
    res.render('compare');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});