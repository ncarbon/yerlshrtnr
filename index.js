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
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

/*
Middleware handles short URL id creation. 
Checks if a custom id was provided and assigns it to shortId in the request body.
If no custom id was provided, a random 7 long character string is generated as the id.
*/
// var generateId = (req, res, next) => {
//     if(req.body.customId) {
//         var customId = req.body.customId;
//         // check if customId already exists in db
//         client.exists(customId, (err, reply) => {
//             if(reply === 1) {
//                 req.body.shortId = randomId();      // still generate a random id if custom one already exists
//                 req.body.duplicate = true;
//             } else {
//                 console.log('CUSTOM ID', customId)
//                 req.body.shortId = customId;
//             }
//             next();
//         });
//     } else {
//         req.body.shortId = randomId();
//         next();
//     }
// }

var checkCustomId = (customId) => {
    return new Promise ((resolve, reject) => {
        client.exists(customId, (err, reply) => {
            if(err) {
                reject(err);
            }
            if(reply == 1) {
                resolve(true);
            } 
            resolve(false);
        });
    });
}

//app.use(generateId);


app.get('/', (req, res) => {
    res.render('index');
});

// post request for creating a short url
app.post('/api/shortURL', (req, res) => {
    checkCustomId(req.body.customId).then((result) => {
        var id, duplicate;
        console.log(`req.body.customId: ${req.body.customId}`);
        console.log(`result: ${result}`);
        if(req.body.customId && !result) {
            id = req.body.customId;
            duplicate = false;
        } else if(req.body.customId) {
            id = randomId();
            duplicate = true;
        } else {
            id = randomId();
            duplicate = false;
        }

        // add expiration to key if time to live is passed in
        // client should make sure ttl is sent in seconds
        if(req.body.ttl) {
            client.set(id, req.body.url, 'EX', req.body.ttl, (err, reply) => {
                if(err) {
                    console.log(err);
                    res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
                } else {
                    res.status(200).json( {
                        message: 'Short URL successfully generated.',
                        originalURL: req.body.url,
                        shortURL: base_url + '/' + id,
                        expires: true,
                        ttl: req.body.ttl,
                        customId: req.body.customId,
                        duplicate: duplicate
                    });
                }
            });
         } else {
            client.set(id, req.body.url, null, null, (err, reply) => {
                if(err) {
                    console.log(err);
                    res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
                } else {
                    res.status(200).json({
                        message: 'Short URL successfully generated.',
                        originalURL: req.body.url,
                        shortURL: base_url + '/' + id,
                        expires: false,
                        customId: req.body.customId,
                        duplicate: duplicate
                    });
                }
            });
        }
    }).catch((err) => {
        console.log(err);
    });
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