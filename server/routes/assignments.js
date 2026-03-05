const express = require('express');
const { body, validationResult } = require('express-validator');
const { TestAssignment, TestTemplate, User, TemplateParameter, TestAssignmentTester } = require('../models');
const { authenticateToken, authorizeAdmin, authorizeTester, authorizeCompany } = require('../middleware/auth');

const router = express.Router();

// Get assignments (role-based access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, testerId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    let includeClause = [
      {
        model: TestTemplate,
        as: 'template',
        attributes: ['id', 'name', 'category']
      },
      {
        model: User,
        as: 'tester',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: User,
        as: 'testers',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: ['assignedAt'] }
      },
      {
        model: User,
        as: 'assignedBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];
    
    // Role-based filtering
    if (req.user.role === 'tester') {
      // For testers, check both old single assignment and new multi-assignment
      includeClause[2].where = { id: req.user.id }; // Filter testers include
      includeClause[2].required = true; // Make it an inner join
    } else if (testerId && ['admin', 'qa_manager', 'company'].includes(req.user.role)) {
      // For admins/QA filtering by specific tester
      includeClause[2].where = { id: testerId };
      includeClause[2].required = true;
    }

    if (status) whereClause.status = status;

    const { count, rows: assignments } = await TestAssignment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: includeClause,
      distinct: true // Prevent duplicate counts due to joins
    });

    res.json({
      assignments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assignment (Admin only)
router.post('/', [
  authenticateToken,
  authorizeAdmin,
  body('templateId').isUUID(),
  body('assignedTesterId').optional({ checkFalsy: true }).isUUID(), // Keep for backward compatibility, ignore empty strings
  body('assignedTesterIds').optional().isArray(), // New field for multiple testers
  body('assignedTesterIds.*').optional().isUUID(), // Validate each tester ID
  body('batchNumber').trim().isLength({ min: 1 }),
  body('productName').trim().isLength({ min: 1 }),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Assignment creation validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateId, assignedTesterId, assignedTesterIds, batchNumber, productName, dueDate, notes } = req.body;

    // Determine which testers to assign (support both single and multiple)
    let testerIds = [];
    if (assignedTesterIds && assignedTesterIds.length > 0) {
      testerIds = assignedTesterIds;
    } else if (assignedTesterId) {
      testerIds = [assignedTesterId];
    } else {
      return res.status(400).json({ message: 'At least one tester must be assigned' });
    }

    // Verify template exists and is active
    const template = await TestTemplate.findOne({
      where: { id: templateId, isActive: true }
    });
    if (!template) {
      return res.status(404).json({ message: 'Template not found or inactive' });
    }

    // Verify all testers exist and are active
    const testers = await User.findAll({
      where: { id: testerIds, role: 'tester', isActive: true }
    });
    if (testers.length !== testerIds.length) {
      return res.status(404).json({ message: 'One or more testers not found or inactive' });
    }

    const assignment = await TestAssignment.create({
      templateId,
      assignedTesterId: testerIds[0], // Keep first tester for backward compatibility
      assignedById: req.user.id,
      batchNumber,
      productName,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes
    });

    // Create many-to-many relationships for all testers
    const testerAssignments = testerIds.map(testerId => ({
      testAssignmentId: assignment.id,
      testerId: testerId
    }));
    await TestAssignmentTester.bulkCreate(testerAssignments);

    // Fetch complete assignment with relations
    const completeAssignment = await TestAssignment.findByPk(assignment.id, {
      include: [
        {
          model: TestTemplate,
          as: 'template',
          attributes: ['id', 'name', 'category']
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'testers',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: ['assignedAt'] }
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: completeAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await TestAssignment.findByPk(req.params.id, {
      include: [
        {
          model: TestTemplate,
          as: 'template',
          include: [{
            model: TemplateParameter,
            as: 'parameters',
            order: [['sequenceOrder', 'ASC']]
          }]
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'testers',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: ['assignedAt'] }
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access permissions
    if (req.user.role === 'tester') {
      // Check if user is assigned to this test (either old way or new way)
      const isAssigned = assignment.assignedTesterId === req.user.id || 
                        assignment.testers.some(tester => tester.id === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment (Admin only)
router.put('/:id', [
  authenticateToken,
  authorizeAdmin,
  body('templateId').optional().isUUID(),
  body('assignedTesterId').optional().isUUID(),
  body('batchNumber').optional().trim().isLength({ min: 1 }),
  body('productName').optional().trim().isLength({ min: 1 }),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await TestAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment can be updated (only if not started)
    if (assignment.status !== 'assigned') {
      return res.status(400).json({ message: 'Cannot update assignment that has been started' });
    }

    const { templateId, assignedTesterId, batchNumber, productName, dueDate, notes } = req.body;

    // Verify template exists and is active if provided
    if (templateId) {
      const template = await TestTemplate.findOne({
        where: { id: templateId, isActive: true }
      });
      if (!template) {
        return res.status(404).json({ message: 'Template not found or inactive' });
      }
    }

    // Verify tester exists and is active if provided
    if (assignedTesterId) {
      const tester = await User.findOne({
        where: { id: assignedTesterId, role: 'tester', isActive: true }
      });
      if (!tester) {
        return res.status(404).json({ message: 'Tester not found or inactive' });
      }
    }

    // Update assignment
    const updateData = {};
    if (templateId) updateData.templateId = templateId;
    if (assignedTesterId) updateData.assignedTesterId = assignedTesterId;
    if (batchNumber) updateData.batchNumber = batchNumber;
    if (productName) updateData.productName = productName;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updateData.notes = notes;

    await assignment.update(updateData);

    // Fetch complete updated assignment with relations
    const updatedAssignment = await TestAssignment.findByPk(assignment.id, {
      include: [
        {
          model: TestTemplate,
          as: 'template',
          attributes: ['id', 'name', 'category']
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'testers',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: ['assignedAt'] }
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment status
router.put('/:id/status', [
  authenticateToken,
  body('status').isIn(['assigned', 'in_progress', 'submitted', 'approved', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await TestAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const { status } = req.body;

    // Check permissions based on status change
    if (status === 'in_progress' || status === 'submitted') {
      if (req.user.role !== 'tester' || assignment.assignedTesterId !== req.user.id) {
        return res.status(403).json({ message: 'Only assigned tester can update to this status' });
      }
    } else if (status === 'approved' || status === 'rejected') {
      if (req.user.role !== 'qa_manager' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only QA Manager or Admin can approve/reject' });
      }
    }

    await assignment.update({ status });

    res.json({
      message: 'Assignment status updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment (Admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const assignment = await TestAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment has been started
    if (assignment.status !== 'assigned') {
      return res.status(400).json({ message: 'Cannot delete assignment that has been started' });
    }

    await assignment.destroy();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
