const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');

router.use('/auth', authRoutes);
router.use('/event', eventRoutes);






module.exports = router;