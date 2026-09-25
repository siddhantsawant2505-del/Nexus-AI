const express = require('express');
const router = express.Router();
const { getWorkouts, createWorkout, getWorkout, deleteWorkout } = require('../controllers/workout.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/v1/workouts          — list (paginated)
router.get('/', getWorkouts);

// POST /api/v1/workouts          — log new session
router.post('/', createWorkout);

// GET  /api/v1/workouts/:id      — single session
router.get('/:id', getWorkout);

// DELETE /api/v1/workouts/:id    — remove session
router.delete('/:id', deleteWorkout);

module.exports = router;
