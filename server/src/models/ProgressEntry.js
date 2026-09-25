const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date:          { type: Date, required: true },
    strength:      { type: Number, default: 0, min: 0, max: 100 },
    endurance:     { type: Number, default: 0, min: 0, max: 100 },
    agility:       { type: Number, default: 0, min: 0, max: 100 },
    totalVolume:   { type: Number, default: 0 },  // kg lifted / reps total
    avgIntensity:  { type: Number, default: 0, min: 0, max: 100 },  // %
  },
  { timestamps: true }
);

progressEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('ProgressEntry', progressEntrySchema);
