const shortUrlController = require('../controllers/shortUrlController');
const express = require('express');
const router = express.Router();

router.route('/')
    .post(shortUrlController.create);

module.exports = router;