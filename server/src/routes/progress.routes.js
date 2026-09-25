const express = require('express');
const router = express.Router();
const {
  getProgress,
  createProgressEntry,
  getAchievements,
} = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/v1/progress?range=7d|30d|all
router.get('/', getProgress);

// POST /api/v1/progress
router.post('/', createProgressEntry);

// GET  /api/v1/progress/achievements
router.get('/achievements', getAchievements);

module.exports = router;
