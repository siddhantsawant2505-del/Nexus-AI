const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getMyRank,
  getActiveLobbies,
} = require('../controllers/arena.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/v1/arena/leaderboard
router.get('/leaderboard', getLeaderboard);

// GET /api/v1/arena/my-rank
router.get('/my-rank', getMyRank);

// GET /api/v1/arena/active-lobbies
router.get('/active-lobbies', getActiveLobbies);

module.exports = router;
