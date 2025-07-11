const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const merchantRoutes = require("./merchantRoutes")

router.use('/auth', authRoutes);
router.use('/event', eventRoutes);
router.use('/merchant', merchantRoutes)



module.exports = router;