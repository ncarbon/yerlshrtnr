'use strict';

require('dotenv').config();

const express = require('express');
const app = express();
const redis = require('redis');
const randomId = require('./randomId');
const bodyParser = require('body-parser');
const indexRoute = require('./routes/indexRoute');
const shortUrlRoute = require('./routes/shortUrlRoute');
const port = process.env.PORT || 3100;

const indexController = require('./controllers/indexController');
const shortUrlController = require('./controllers/shortUrlController');

const base_url = process.env.BASE_URL;

// Set up connection to Redis
const client = redis.createClient(process.env.REDISLABS_SERVER, {
    password: process.env.REDISLABS_PASSWORD
});

client.on('error', (err) => {
    console.log('Error: Could not start redis');
});

// setting a single point of redis connection
indexController.setClient(client);
shortUrlController.setClient(client);

app.set('base_url', base_url);
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.use('/', indexRoute);
app.use('/api/shorturl', shortUrlRoute);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

module.exports = app;