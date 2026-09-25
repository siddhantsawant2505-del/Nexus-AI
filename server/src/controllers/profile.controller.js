const Profile = require('../models/Profile');

// GET /api/v1/profile
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/profile  (Lab onboarding + general edits)
const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'height', 'weight', 'age', 'bodyFat',
      'goals', 'equipment', 'allergies', 'experience',
      'calibrated', 'attributes',
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/profile/xp  — grant XP and check level-up
const grantXP = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile.xp += amount;
    profile.syncPoints += Math.floor(amount / 10);
    profile.checkLevelUp();
    await profile.save();

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, grantXP };
