const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate } = require('../controllers/template.controller');
const { protect } = require('../middleware/auth');

// Public or Protected? Let's protect them to ensure only Nexus operators see protocols
router.use(protect);

router.get('/', getTemplates);
router.post('/', createTemplate);

module.exports = router;
