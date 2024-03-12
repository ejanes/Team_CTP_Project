const express = require('express');
const path = require('path');
const app = express();
const port = 8080;
app.use(express.static(__dirname));

app.get('/',(req,res) => {
    res.set('Content-Type', 'text/html');
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/public/style.css',(req,res) => {
    res.set('Content-Type', 'text/css');
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/public/banner.jpg',(req,res) => {
    res.set('Content-Type', 'image/jpeg');
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.join(__dirname, 'public', 'banner.jpg'));
});

app.get('/public/functions.js',(req,res) => {
    res.set('Content-Type', 'image/jpeg');
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(path.join(__dirname, 'public', 'banner.jpg'));
});

app.listen(port, () => {
    console.log('app is listening on ' + port)
});