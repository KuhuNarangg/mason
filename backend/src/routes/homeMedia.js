const express = require('express');
const router = express.Router();
const { getHomeMedia } = require('../controllers/homeMediaController');

router.get('/', getHomeMedia);

module.exports = router;
