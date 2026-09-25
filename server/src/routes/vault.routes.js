const express = require('express');
const router = express.Router();
const { getCollectibles, getVaultSummary, addCollectible } = require('../controllers/vault.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/v1/vault/collectibles
router.get('/collectibles', getCollectibles);

// GET  /api/v1/vault/summary
router.get('/summary', getVaultSummary);

// POST /api/v1/vault/collectibles
router.post('/collectibles', addCollectible);

module.exports = router;
