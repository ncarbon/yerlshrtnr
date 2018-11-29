const redis = require('redis');
const randomId = require('../randomId');
const base_url = process.env.BASE_URL;

var client;

/*
will generate a random url id if a custom id was not provided or
if the custom id already exists in the database
*/
var generateId = (req) => {
    return new Promise ((resolve, reject) => {
        if(req.body.customId) {
            client.exists(req.body.customId, (err, reply) => {
                if(err) {
                    console.log(err);
                    reject(err);
                }
                if(reply == 1) {
                    resolve({
                        id: customId,
                        duplicate: false
                    });
                } 
                resolve({
                    id: randomId(),
                    duplicate: true
                });
            });
        } else {
            resolve({
                id: randomId(),
                duplicate: false
            });
        }
    });
};

const create = (req, res) => {
    generateId(req).then((result) => {
        if(req.body.ttl) {
            // TODO: figure out of other redis client exists that allows passing null instead of 'EX' and ttl
            // for the cases were expiration is not needed
            client.set(result.id, req.body.url, 'EX', req.body.ttl, (err, reply) => {
                if(err) {
                    console.log(err);
                    res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
                } else {
                    res.status(200).json( {
                        message: 'Short URL successfully generated.',
                        originalURL: req.body.url,
                        shortURL: base_url + '/' + result.id,
                        expires: true,
                        ttl: req.body.ttl,
                        customId: req.body.customId,
                        duplicate: result.id
                    });
                }
            });
         } else {
            client.set(result.id, req.body.url, (err, reply) => {
                if(err) {
                    console.log(err);
                    res.status(400).json({error: {type: 'CREATION', message: `Unable to generate generate short URL.`}});
                } else {
                    res.status(200).json({
                        message: 'Short URL successfully generated.',
                        originalURL: req.body.url,
                        shortURL: base_url + '/' + result.id,
                        expires: false,
                        customId: req.body.customId,
                        duplicate: result.duplicate
                    });
                }
            });
        }
    }).catch((err) => {
        console.log(err);
        res.status(400).json({error: {type: '', message: `Unable to generate generate short URL.`}});
    });
};


module.exports = {
    setClient: (inClient) => { client = inClient;},
    create
}