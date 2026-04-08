const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ token: generateToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, color: user.color } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: generateToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, color: user.color } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, color: req.user.color });
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, color, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (color) user.color = color;
    if (currentPassword && newPassword) {
      const match = await user.matchPassword(currentPassword);
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, color: user.color });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: 'TaskFlow Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. It expires in 30 minutes.</p>
        <a href="${resetUrl}" style="background:#7c6fff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Push notification subscription
router.post('/push-subscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: req.body }, { new: true });
    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;