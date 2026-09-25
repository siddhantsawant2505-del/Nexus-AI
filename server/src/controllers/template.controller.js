const WorkoutTemplate = require('../models/WorkoutTemplate');

// GET /api/v1/templates
const getTemplates = async (req, res, next) => {
  try {
    const templates = await WorkoutTemplate.find({}).sort({ difficulty: 1, name: 1 });
    res.json({ success: true, count: templates.length, templates });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/templates (Optional: for later AI integration)
const createTemplate = async (req, res, next) => {
  try {
    const template = await WorkoutTemplate.create(req.body);
    res.status(201).json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplates, createTemplate };
