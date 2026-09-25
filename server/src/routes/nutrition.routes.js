const express = require('express');
const router = express.Router();
const {
  getToday,
  logMeal,
  deleteMeal,
  updateHydration,
  getHistory,
} = require('../controllers/nutrition.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET   /api/v1/nutrition/today
router.get('/today', getToday);

// POST  /api/v1/nutrition/meal
router.post('/meal', logMeal);

// DELETE /api/v1/nutrition/meal/:mealId
router.delete('/meal/:mealId', deleteMeal);

// PATCH /api/v1/nutrition/hydration
router.patch('/hydration', updateHydration);

// GET   /api/v1/nutrition/history?days=7
router.get('/history', getHistory);

module.exports = router;
