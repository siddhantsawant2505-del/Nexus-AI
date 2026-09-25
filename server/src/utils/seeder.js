require('dotenv').config();
const mongoose = require('mongoose');
const WorkoutTemplate = require('../models/WorkoutTemplate');

const templates = [
  { name: "Upper Body Assault", duration: "45 min", difficulty: "Hard", equipment: ["Barbell", "Dumbbells"], muscles: ["Chest", "Shoulders", "Triceps"] },
  { name: "HIIT Inferno", duration: "30 min", difficulty: "Extreme", equipment: ["Bodyweight", "Kettlebell"], muscles: ["Full Body"] },
  { name: "Leg Day Protocol", duration: "55 min", difficulty: "Hard", equipment: ["Squat Rack", "Leg Press"], muscles: ["Quads", "Hamstrings", "Glutes"] },
  { name: "Core Destroyer", duration: "25 min", difficulty: "Medium", equipment: ["Bodyweight", "Ab Wheel"], muscles: ["Core", "Obliques"] },
  { name: "Pull Power", duration: "40 min", difficulty: "Hard", equipment: ["Pull-up Bar", "Cable Machine"], muscles: ["Back", "Biceps"] },
  { name: "Mobility Flow", duration: "20 min", difficulty: "Easy", equipment: ["Bodyweight", "Band"], muscles: ["Full Body"] },
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[SEED] Connected to MongoDB');

    await WorkoutTemplate.deleteMany();
    console.log('[SEED] Old templates purged');

    await WorkoutTemplate.insertMany(templates);
    console.log('[SEED] Workout templates synchronized');

    process.exit();
  } catch (err) {
    console.error('[SEED] Fatal error:', err.message);
    process.exit(1);
  }
};

seedTemplates();
