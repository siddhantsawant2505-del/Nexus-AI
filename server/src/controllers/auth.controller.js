const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, codename } = req.body;
    if (!email || !password || !codename) {
      return res.status(400).json({ success: false, message: 'email, password, and codename are required' });
    }

    const user = await User.create({ email, password, codename });

    // Create a blank profile for the new user
    await Profile.create({ userId: user._id });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/me  (protected)
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
