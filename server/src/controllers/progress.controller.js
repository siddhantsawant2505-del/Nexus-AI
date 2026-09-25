const ProgressEntry = require('../models/ProgressEntry');
const Achievement = require('../models/Achievement');

// GET /api/v1/progress?range=7d|30d|all
const getProgress = async (req, res, next) => {
  try {
    const { range = '7d' } = req.query;
    let since = null;

    if (range === '7d') {
      since = new Date();
      since.setDate(since.getDate() - 7);
    } else if (range === '30d') {
      since = new Date();
      since.setDate(since.getDate() - 30);
    }

    const query = { userId: req.user._id };
    if (since) query.date = { $gte: since };

    const entries = await ProgressEntry.find(query).sort({ date: 1 });
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/progress
const createProgressEntry = async (req, res, next) => {
  try {
    const { date, strength, endurance, agility, totalVolume, avgIntensity } = req.body;

    const entry = await ProgressEntry.create({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      strength, endurance, agility, totalVolume, avgIntensity,
    });

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/progress/achievements
const getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ userId: req.user._id }).sort({ awardedAt: -1 });
    res.json({ success: true, achievements });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgress, createProgressEntry, getAchievements };
