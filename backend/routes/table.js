const express = require('express');
const router = express.Router();
const { getCurrentTable } = require('../controllers/tableController');

router.get('/', getCurrentTable);

module.exports = router;

