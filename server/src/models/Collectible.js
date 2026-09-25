const mongoose = require('mongoose');

const collectibleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name:       { type: String, required: true },
    rarity: {
      type: String,
      enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'],
      default: 'COMMON',
    },
    icon:       { type: String, default: 'Trophy' },  // lucide icon name
    acquiredAt: { type: Date, default: Date.now },
    synergy:    { type: String, default: 'UNLOCKED' },
    locked:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Collectible', collectibleSchema);
