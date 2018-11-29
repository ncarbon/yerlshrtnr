const indexController = require('../controllers/indexController');
const express = require('express');
const router = express.Router();


router.route('/')
    .get(indexController.index);


router.route('/:shortId')
    .get(indexController.redirect);

module.exports = router;