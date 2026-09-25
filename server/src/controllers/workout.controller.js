const WorkoutSession = require('../models/WorkoutSession');
const Profile = require('../models/Profile');
const Achievement = require('../models/Achievement');

// GET /api/v1/workouts
const getWorkouts = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [sessions, total] = await Promise.all([
      WorkoutSession.find({ userId: req.user._id })
        .sort({ sessionDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkoutSession.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, total, page: Number(page), sessions });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/workouts
const createWorkout = async (req, res, next) => {
  try {
    const { name, durationMins, caloriesBurned, exercises, formScores, mlAnalysisId } = req.body;
    if (!name || !durationMins) {
      return res.status(400).json({ success: false, message: 'name and durationMins are required' });
    }

    // Base XP: 10 per minute + 1 per calorie (capped at bonus 500)
    const xpGranted = Math.min(durationMins * 10 + (caloriesBurned || 0), 1500);

    const session = await WorkoutSession.create({
      userId: req.user._id,
      name, durationMins, caloriesBurned, exercises, formScores, mlAnalysisId, xpGranted,
    });

    // Update profile stats
    const profile = await Profile.findOne({ userId: req.user._id });
    if (profile) {
      profile.totalMissions += 1;
      profile.totalCalsBurned += caloriesBurned || 0;
      profile.xp += xpGranted;
      profile.syncPoints += Math.floor(xpGranted / 10);
      // Recalculate average session time
      profile.avgSessionMins = Math.round(
        (profile.avgSessionMins * (profile.totalMissions - 1) + durationMins) / profile.totalMissions
      );
      profile.checkLevelUp();
      await profile.save();
    }

    // Check first-100-missions achievement
    if (profile && profile.totalMissions === 100) {
      await Achievement.create({
        userId: req.user._id,
        title: 'Centurion Protocol',
        description: 'Completed 100 workout missions.',
        icon: 'Shield',
        xpReward: 500,
      });
    }

    res.status(201).json({ success: true, session, xpGranted });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/workouts/:id
const getWorkout = async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/workouts/:id
const deleteWorkout = async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWorkouts, createWorkout, getWorkout, deleteWorkout };
