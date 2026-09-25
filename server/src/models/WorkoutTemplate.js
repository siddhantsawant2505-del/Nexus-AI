const mongoose = require('mongoose');

const workoutTemplateSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, unique: true, trim: true },
    duration:     { type: String, required: true }, // e.g. "45 min"
    difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard', 'Extreme'], required: true },
    equipment:    { type: [String], default: [] },
    muscles:      { type: [String], default: [] },
    description:  { type: String, default: '' },
    isAI:         { type: Boolean, default: true },
    exercises:    [
      {
        name: { type: String, required: true },
        reps: { type: Number, default: 0 },
        sets: { type: Number, default: 0 },
        weight: { type: Number, default: 0 },
        difficulty: { type: String }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);
