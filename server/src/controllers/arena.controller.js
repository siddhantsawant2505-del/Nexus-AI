const Profile = require('../models/Profile');
const User = require('../models/User');

// GET /api/v1/arena/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Aggregate profiles ranked by syncPoints descending
    const profiles = await Profile.find({})
      .sort({ syncPoints: -1, level: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'codename createdAt');

    const total = await Profile.countDocuments();

    const leaderboard = profiles.map((p, i) => ({
      rank: skip + i + 1,
      userId: p.userId?._id,
      codename: p.userId?.codename || 'UNKNOWN',
      level: p.level,
      syncPoints: p.syncPoints,
      streak: p.streak,
      totalMissions: p.totalMissions,
      attributes: p.attributes,
      isCurrentUser: p.userId?._id?.toString() === req.user._id.toString(),
    }));

    res.json({ success: true, total, leaderboard });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/arena/my-rank
const getMyRank = async (req, res, next) => {
  try {
    const myProfile = await Profile.findOne({ userId: req.user._id });
    if (!myProfile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Count how many have MORE syncPoints  → rank = that count + 1
    const rank = (await Profile.countDocuments({ syncPoints: { $gt: myProfile.syncPoints } })) + 1;
    const total = await Profile.countDocuments();

    res.json({
      success: true,
      rank,
      total,
      syncPoints: myProfile.syncPoints,
      level: myProfile.level,
      streak: myProfile.streak,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/arena/active-lobbies  (mock — replace with real matchmaking later)
const getActiveLobbies = async (req, res, next) => {
  try {
    const totalOperators = await Profile.countDocuments();
    // Simulate ~35% of users active in lobbies
    const activeCount = Math.max(Math.floor(totalOperators * 0.35), 1);
    res.json({ success: true, activeLobbies: 1, activeOperators: activeCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard, getMyRank, getActiveLobbies };
