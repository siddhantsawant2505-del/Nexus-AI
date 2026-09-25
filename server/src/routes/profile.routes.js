const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, grantXP } = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth');

// All profile routes require auth
router.use(protect);

// GET  /api/v1/profile
router.get('/', getProfile);

// PUT  /api/v1/profile
router.put('/', updateProfile);

// POST /api/v1/profile/xp
router.post('/xp', grantXP);

module.exports = router;
