const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const merchantRoutes = require("./merchantRoutes")
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/event', eventRoutes);
router.use('/merchant', merchantRoutes)
router.use('/admin', adminRoutes);


module.exports = router;