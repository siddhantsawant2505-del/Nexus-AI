const Collectible = require('../models/Collectible');

// GET /api/v1/vault/collectibles
const getCollectibles = async (req, res, next) => {
  try {
    const collectibles = await Collectible.find({ userId: req.user._id }).sort({ acquiredAt: -1 });
    res.json({ success: true, collectibles });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/vault/summary
const getVaultSummary = async (req, res, next) => {
  try {
    const all = await Collectible.find({ userId: req.user._id });

    const total = all.length;
    const mythicCount = all.filter((c) => c.rarity === 'MYTHIC').length;
    const legendaryCount = all.filter((c) => c.rarity === 'LEGENDARY').length;
    const recentAcquisitions = all
      .sort((a, b) => b.acquiredAt - a.acquiredAt)
      .slice(0, 5)
      .map((c) => ({ name: c.name, time: c.acquiredAt }));

    res.json({
      success: true,
      summary: {
        totalCollectibles: total,
        mythicYield: mythicCount,
        legendaryYield: legendaryCount,
        recentAcquisitions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/vault/collectibles  (admin/system grant)
const addCollectible = async (req, res, next) => {
  try {
    const { name, rarity, icon, synergy } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const collectible = await Collectible.create({
      userId: req.user._id,
      name, rarity, icon, synergy,
    });

    res.status(201).json({ success: true, collectible });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCollectibles, getVaultSummary, addCollectible };
