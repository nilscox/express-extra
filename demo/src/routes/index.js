const router = module.exports = require('express').Router();

router.use('/author', require('./author'));
router.use('/book', require('./book'));
