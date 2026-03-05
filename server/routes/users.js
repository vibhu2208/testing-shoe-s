const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/', [
  authenticateToken,
  authorizeAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('role').isIn(['admin', 'tester', 'qa_manager', 'company'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', [
  authenticateToken,
  authorizeAdmin,
  body('email').optional().isEmail().normalizeEmail(),
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'tester', 'qa_manager', 'company']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { email, firstName, lastName, role, isActive } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset user password (Admin only)
router.put('/:id/reset-password', [
  authenticateToken,
  authorizeAdmin,
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { newPassword } = req.body;
    await user.update({ password: newPassword });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user (Admin only)
router.put('/:id/deactivate', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate user (Admin only)
router.put('/:id/activate', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: true });

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed QA Manager account (Admin only)
router.post('/seed-qa', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Check if QA Manager account already exists
    const existingQA = await User.findOne({ 
      where: { 
        email: 'qa@testingsystem.com',
        role: 'qa_manager'
      } 
    });

    if (existingQA) {
      return res.status(400).json({ 
        message: 'QA Manager account already exists',
        user: {
          id: existingQA.id,
          email: existingQA.email,
          firstName: existingQA.firstName,
          lastName: existingQA.lastName,
          role: existingQA.role,
          isActive: existingQA.isActive
        }
      });
    }

    // Create QA Manager account
    const qaUser = await User.create({
      email: 'qa@testingsystem.com',
      password: 'qa123456',
      firstName: 'QA',
      lastName: 'Manager',
      role: 'qa_manager',
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'QA Manager account created successfully',
      user: {
        id: qaUser.id,
        email: qaUser.email,
        firstName: qaUser.firstName,
        lastName: qaUser.lastName,
        role: qaUser.role,
        isActive: qaUser.isActive,
        createdAt: qaUser.createdAt
      },
      credentials: {
        email: 'qa@testingsystem.com',
        password: 'qa123456'
      }
    });
  } catch (error) {
    console.error('Seed QA account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
