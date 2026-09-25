const NutritionLog = require('../models/NutritionLog');

// Normalize a date to midnight UTC for consistent daily lookups
const toDay = (d = new Date()) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// GET /api/v1/nutrition/today
const getToday = async (req, res, next) => {
  try {
    const today = toDay();
    let log = await NutritionLog.findOne({ userId: req.user._id, date: today });
    if (!log) {
      // Auto-create today's log
      log = await NutritionLog.create({ userId: req.user._id, date: today });
    }
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/nutrition/meal — add a meal to today's log
const logMeal = async (req, res, next) => {
  try {
    const { name, cals, protein, carbs, fat, time, type, mlScanId } = req.body;
    if (!name || cals === undefined) {
      return res.status(400).json({ success: false, message: 'name and cals are required' });
    }

    const today = toDay();
    const log = await NutritionLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      {
        $push: { meals: { name, cals, protein, carbs, fat, time, type, mlScanId } },
        $setOnInsert: { calorieGoal: 2400, hydrationL: 0 },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/nutrition/meal/:mealId
const deleteMeal = async (req, res, next) => {
  try {
    const today = toDay();
    const log = await NutritionLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { $pull: { meals: { _id: req.params.mealId } } },
      { new: true }
    );
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/nutrition/hydration
const updateHydration = async (req, res, next) => {
  try {
    const { hydrationL } = req.body;
    if (hydrationL === undefined) {
      return res.status(400).json({ success: false, message: 'hydrationL is required' });
    }
    const today = toDay();
    const log = await NutritionLog.findOneAndUpdate(
      { userId: req.user._id, date: today },
      { $set: { hydrationL } },
      { new: true, upsert: true }
    );
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/nutrition/history?days=7
const getHistory = async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = toDay();
    since.setDate(since.getDate() - days);

    const logs = await NutritionLog.find({
      userId: req.user._id,
      date: { $gte: since },
    }).sort({ date: -1 });

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getToday, logMeal, deleteMeal, updateHydration, getHistory };
