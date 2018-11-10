'use strict';

require('dotenv').config();

const express = require('express');
const app = express();
const redis = require('redis');
const randomId = require('./randomId');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3100;

const base_url = process.env.BASE_URL;

// Set up connection to Redis
const client = redis.createClient(process.env.REDISLABS_SERVER, {
    password: process.env.REDISLABS_PASSWORD
});

client.on('error', (err) => {
    console.log('Error: Could not start redis');
});

app.set('base_url', base_url);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + '/public'));

/*
Middleware handles short URL id creation. 
Checks if a custom id was provided and assigns it to shortId in the request body.
If no custom id was provided, a random 7 long character string is generated as the id.
*/
var generateId = (req, res, next) => {
    if(req.body.customId) {
        var customId = req.body.customId;
        // check if customId already exists in db
        client.exists(customId, (err, reply) => {
            if(reply === 1) {
                res.status(400).json({error: {type: 'DUPLICATE', message: `key ${customId} could not be generated. Key already taken`}});
            } else {
                req.body.shortId = customId;
            }
            next();
        });
    } else {
        req.body.shortId = randomId();
        next();
    }
}

app.use(generateId);


app.get('/', (req, res) => {
    res.sendFile('./public/index.html');
});

// post request for creating a short url
app.post('/api/shortURL', (req, res) => {
    var url = req.body.url;
    // add expiration to key if time to live is passed in
    // client should make sure ttl is sent in seconds
    if(req.body.ttl) {
        client.set(req.body.shortId, url, 'EX', req.body.ttl, (err, reply) => {
            if(err) {
                console.log(err);
                res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
            } else {
                res.status(200).json({
                    success: {
                        message: 'Short URL successfully generated.',
                        originalURL: url,
                        shortURL: base_url + '/' + req.body.shortId,
                        expires: true,
                        ttl: req.body.ttl
                    }
                });
            }
        });
    } else {
        client.set(req.body.shortId, url, (err, reply) => {
            if(err) {
                console.log(err);
                res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
            } else {
                res.status(200).json({
                    success: {
                        message: 'Short URL successfully generated.',
                        originalURL: url,
                        shortURL: base_url + '/' + req.body.shortId,
                        expires: false
                    }
                });
            }
        });
    }
});

// get request for short URL that redirects to original URL
app.get('/:id', (req, res) => {
    var id = req.params.id.trim();
    client.get(id, (err, reply) => {
        if(reply) {
            res.set('location', reply);
            res.status(301).send();
           
        } else {
            res.status(404).json({error: {type: 'NOT_FOUND', message: `Unable to find id ${id}.`}});
        }
    });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

module.exports = app;