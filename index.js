const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/request', (req, res) => {
    res.render('request-device');
});

app.get('/profile', (req, res) => {
    res.render('profile');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});