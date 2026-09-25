const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    sets:       { type: Number, default: 0 },
    reps:       { type: Number, default: 0 },
    weightKg:   { type: Number, default: 0 },
    durationSec:{ type: Number, default: 0 },
    notes:      { type: String, default: '' },
  },
  { _id: false }
);

const formScoreSchema = new mongoose.Schema(
  {
    stability:  { type: Number, default: null, min: 0, max: 100 },
    eccentric:  { type: Number, default: null, min: 0, max: 100 },
    explosive:  { type: Number, default: null, min: 0, max: 100 },
    depth:      { type: Number, default: null, min: 0, max: 100 },
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name:            { type: String, required: true, trim: true },
    durationMins:    { type: Number, required: true, min: 0 },
    caloriesBurned:  { type: Number, default: 0, min: 0 },
    exercises:       { type: [exerciseSchema], default: [] },
    formScores:      { type: formScoreSchema, default: () => ({}) },

    // Optional: reference to ML analysis result ID (stored in ML service)
    mlAnalysisId:    { type: String, default: null },

    // XP granted for this session
    xpGranted:       { type: Number, default: 0 },

    sessionDate:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ userId: 1, sessionDate: -1 });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
