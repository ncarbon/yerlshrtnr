'use strict';

require('dotenv').config();

const express = require('express');
const app = express();
const redis = require('redis');
const port = process.env.PORT || 3100;
const shortid = require('shortid');
const bodyParser = require('body-parser');

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

// Serve static files
app.use(express.static(__dirname + '/public'));


var generateId = (req, res, next) => {
    if(req.body.customId) {
        var customId = req.body.customId;
        // check if customURL is not already used
        client.exists(customId, (err, reply) => {
            if(reply === 1) {
                req.status(400).json({type: 1, message: `Error: key ${customId} could not be generated. Key already taken`})
            } else {
                req.body.shortId = customId;
            }
            next();
        });
    } else {
        req.body.shortId = shortid.generate();
        next();
    }
}

app.use(generateId);


app.get('/', (req, res) => {
    res.sendFile('./public/index.html');
});

// post request for creating a short url
app.post('/api/short_url', (req, res) => {
    var url = req.body.url;
    // add expiration to key if time to live is passed in
    // client should make sure ttl is sent in seconds
    if(req.body.ttl) {
        client.set(req.body.shortId, url, 'EX', req.body.ttl, (err, reply) => {
            
            if(err) {
                console.log(err);
                res.status(400).json({type: 2, message: `Error: Unable to generate short URL. Setting expiration time for key ${id} failed.`});
            } else {
                res.json({
                    originalURL: url,
                    shortURL: base_url + '/' + req.body.shortId,
                    expires: true
                });
            }
        });
    } else {
        client.set(req.body.shortId, url, (err, reply) => {
            if(err) {
                console.log(err);
                res.status(400).send('Unable to generate URL');
            } else {
                res.json({
                    originalURL: url,
                    shortURL: base_url + '/' + req.body.shortId,
                    expires: false
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
            res.status(404).json({type: 0, message: `Error: Unable to find key ${id}`});
        }
    });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});