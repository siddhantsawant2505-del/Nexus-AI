const mongoose = require('mongoose');

const attributesSchema = new mongoose.Schema(
  {
    strength:  { type: Number, default: 0, min: 0, max: 100 },
    agility:   { type: Number, default: 0, min: 0, max: 100 },
    endurance: { type: Number, default: 0, min: 0, max: 100 },
    accuracy:  { type: Number, default: 0, min: 0, max: 100 },
    recovery:  { type: Number, default: 0, min: 0, max: 100 },
    power:     { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Biometrics (from Lab onboarding)
    height:   { type: Number, default: null },  // cm
    weight:   { type: Number, default: null },  // kg
    age:      { type: Number, default: null },
    bodyFat:  { type: Number, default: null },  // %

    // Lab selections
    goals:      { type: [String], default: [] },
    equipment:  { type: [String], default: [] },
    allergies:  { type: [String], default: [] },
    experience: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Elite', ''],
      default: '',
    },

    // Gamification
    level:           { type: Number, default: 1 },
    xp:              { type: Number, default: 0 },
    xpToNextLevel:   { type: Number, default: 1000 },
    streak:          { type: Number, default: 0 },  // days
    totalMissions:   { type: Number, default: 0 },
    totalCalsBurned: { type: Number, default: 0 },
    avgSessionMins:  { type: Number, default: 0 },
    syncPoints:      { type: Number, default: 0 },  // Arena currency

    // Performance attributes (0–100)
    attributes: { type: attributesSchema, default: () => ({}) },

    // Lab calibration complete?
    calibrated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-level up based on XP
profileSchema.methods.checkLevelUp = function () {
  while (this.xp >= this.xpToNextLevel) {
    this.xp -= this.xpToNextLevel;
    this.level += 1;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.25);
  }
};

module.exports = mongoose.model('Profile', profileSchema);
