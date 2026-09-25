const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    cals:    { type: Number, required: true, min: 0 },
    protein: { type: Number, default: 0, min: 0 },  // g
    carbs:   { type: Number, default: 0, min: 0 },  // g
    fat:     { type: Number, default: 0, min: 0 },  // g
    time:    { type: String, default: '' },           // e.g. "08:30 AM"
    type: {
      type: String,
      enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'PRE_MISSION', 'POST_MISSION', 'SNACK'],
      default: 'SNACK',
    },
    // Optional: ML food scan result
    mlScanId: { type: String, default: null },
  },
  { _id: true }
);

const nutritionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // One document per calendar day per user
    date: {
      type: Date,
      required: true,
    },
    meals:        { type: [mealSchema], default: [] },
    calorieGoal:  { type: Number, default: 2400 },
    hydrationL:   { type: Number, default: 0 },     // litres consumed
    hydrationGoalL:{ type: Number, default: 3.0 },
  },
  { timestamps: true }
);

// Compound index: one log per user per day
nutritionLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Virtual: total calories consumed
nutritionLogSchema.virtual('totalCals').get(function () {
  return this.meals.reduce((sum, m) => sum + m.cals, 0);
});

nutritionLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
