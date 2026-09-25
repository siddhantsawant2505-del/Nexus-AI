const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    icon:        { type: String, default: 'Zap' },  // lucide icon name
    awardedAt:   { type: Date, default: Date.now },
    xpReward:    { type: Number, default: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);
