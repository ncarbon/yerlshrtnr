const redis = require('redis');

var client;

const index = (req, res) => {
    res.render('/index');
};

const redirect = (req, res) => {
    var id = req.params.shortId.trim();
    client.get(id, (err, reply) => {
        if(reply) {
            res.set('location', reply);
            res.status(301).send();
           
        } else {
            res.status(404).json({error: {type: 'NOT_FOUND', message: `Unable to find id ${id}.`}});
        }
    });
}
module.exports = {
    setClient: (inClient) => { client = inClient;},
    index,
    redirect
};