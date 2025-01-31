const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

console.log('Auth routes initialized');

// Email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Admin Registration
router.post('/admin/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ where: { email, role: 'admin' } });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student Registration
router.post('/student/register', async (req, res) => {
  try {
    const { username, email, password, registrationCode } = req.body;
    
    // TODO: Validate registration code
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'student'
    });

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student Login
router.post('/student/login', async (req, res) => {
  console.log('\n[Student Login] Attempt:', req.body);
  try {
    const { email, password } = req.body;
    const student = await User.findOne({ where: { email, role: 'student' } });

    if (!student) {
      console.log('[Student Login] No student found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Student Login] Found student:', { id: student.id, email: student.email });
    const validPassword = student.validatePassword(password);
    console.log('[Student Login] Password validation result:', validPassword);

    if (!validPassword) {
      console.log('[Student Login] Invalid password for student:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, role: student.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    console.log('[Student Login] Login successful for:', email);
    res.json({ token });
  } catch (error) {
    console.error('[Student Login] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);

    const { username, email, password, role = 'student', college } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please provide username, email, and password.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    console.log('Creating new user with data:', {
      username,
      email,
      role,
      college,
      passwordLength: password ? password.length : 0
    });

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password, // Password will be hashed by the model hook
      role,
      college: college ? college.trim() : null,
      is_verified: true // For testing purposes, set to true by default
    });

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      college: user.college
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        username: user.username,
        college: user.college
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully');

    // Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        college: user.college,
        last_login: user.last_login,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Registration error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors // For Sequelize validation errors
    });

    // Handle specific error types
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Email verification route
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ where: { email: decoded.email, verificationToken: token } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid verification token' });
  }
});

// Create default user route
router.get('/create-default-user', async (req, res) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ where: { email: 'unix@gmail.com' } });
    
    if (!user) {
      // Create default user
      user = await User.create({
        username: 'Unix User',
        email: 'unix@gmail.com',
        password: '123456',
        role: 'student',
        is_verified: true,
        college: 'Test College'
      });
    }

    res.json({
      success: true,
      message: 'Default user created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating default user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating default user',
      error: error.message
    });
  }
});

// Create default admin route
router.get('/create-default-admin', async (req, res) => {
  try {
    // Check if admin already exists
    let admin = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!admin) {
      // Create default admin
      admin = await User.create({
        username: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      });
    } else {
      // Update existing admin to ensure they are verified
      await admin.update({ isVerified: true });
    }

    res.json({
      success: true,
      message: 'Default admin created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error creating default admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating default admin',
      error: error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        username: user.username,
        college: user.college
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        college: user.college,
        last_login: user.last_login,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Save token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Reset your password',
      html: `Please click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email', error: error.message });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

module.exports = router; 