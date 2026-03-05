const express = require('express');
const { body, validationResult } = require('express-validator');
const { TestTemplate, TemplateParameter, User } = require('../models');
const { authenticateToken, authorizeAdmin, authorizeCompany } = require('../middleware/auth');

const router = express.Router();

// Get all templates
router.get('/', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isActive } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const { count, rows: templates } = await TestTemplate.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: TemplateParameter,
          as: 'parameters',
          order: [['sequenceOrder', 'ASC']]
        }
      ]
    });

    res.json({
      templates,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create template (Admin only)
router.post('/', [
  authenticateToken,
  authorizeAdmin,
  body('name').trim().isLength({ min: 1 }),
  body('category').isIn(['raw', 'wip', 'finished_good']),
  body('parameters').isArray({ min: 1 }),
  body('parameters.*.name').trim().isLength({ min: 1 }),
  body('parameters.*.type').isIn(['numeric', 'text', 'dropdown', 'boolean']),
  body('parameters.*.isMandatory').isBoolean(),
  body('parameters.*.sequenceOrder').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, description, parameters } = req.body;

    // Validate parameters based on type
    for (const param of parameters) {
      if (param.type === 'numeric') {
        if (param.minValue !== undefined && param.maxValue !== undefined) {
          if (parseFloat(param.minValue) >= parseFloat(param.maxValue)) {
            return res.status(400).json({ 
              message: `Parameter "${param.name}": minValue must be less than maxValue` 
            });
          }
        }
      }
      if (param.type === 'dropdown') {
        if (!param.dropdownOptions || !Array.isArray(param.dropdownOptions) || param.dropdownOptions.length === 0) {
          return res.status(400).json({ 
            message: `Parameter "${param.name}": dropdown options are required` 
          });
        }
      }
    }

    const template = await TestTemplate.create({
      name,
      category,
      description,
      createdBy: req.user.id
    });

    // Create parameters
    const parameterPromises = parameters.map(param => 
      TemplateParameter.create({
        templateId: template.id,
        name: param.name,
        type: param.type,
        isMandatory: param.isMandatory,
        sequenceOrder: param.sequenceOrder,
        minValue: param.minValue,
        maxValue: param.maxValue,
        dropdownOptions: param.dropdownOptions,
        acceptableValues: param.acceptableValues,
        maxLength: param.maxLength,
        validationPattern: param.validationPattern
      })
    );

    await Promise.all(parameterPromises);

    // Fetch the complete template with parameters
    const completeTemplate = await TestTemplate.findByPk(template.id, {
      include: [{
        model: TemplateParameter,
        as: 'parameters',
        order: [['sequenceOrder', 'ASC']]
      }]
    });

    res.status(201).json({
      message: 'Template created successfully',
      template: completeTemplate
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get template by ID
router.get('/:id', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const template = await TestTemplate.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: TemplateParameter,
          as: 'parameters',
          order: [['sequenceOrder', 'ASC']]
        }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update template (Admin only)
router.put('/:id', [
  authenticateToken,
  authorizeAdmin,
  body('name').optional().trim().isLength({ min: 1 }),
  body('category').optional().isIn(['raw', 'wip', 'finished_good']),
  body('isActive').optional().isBoolean(),
  body('parameters').optional().isArray(),
  body('parameters.*.name').optional().trim().isLength({ min: 1 }),
  body('parameters.*.type').optional().isIn(['numeric', 'text', 'dropdown', 'boolean']),
  body('parameters.*.isMandatory').optional().isBoolean(),
  body('parameters.*.sequenceOrder').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = await TestTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { name, category, description, isActive, parameters } = req.body;

    // Validate parameters if provided
    if (parameters) {
      for (const param of parameters) {
        if (param.type === 'numeric') {
          if (param.minValue !== undefined && param.maxValue !== undefined) {
            if (parseFloat(param.minValue) >= parseFloat(param.maxValue)) {
              return res.status(400).json({ 
                message: `Parameter "${param.name}": minValue must be less than maxValue` 
              });
            }
          }
        }
        if (param.type === 'dropdown') {
          if (!param.dropdownOptions || !Array.isArray(param.dropdownOptions) || param.dropdownOptions.length === 0) {
            return res.status(400).json({ 
              message: `Parameter "${param.name}": dropdown options are required` 
            });
          }
        }
      }
    }

    // Update template basic info
    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await template.update(updateData);

    // Update parameters if provided
    if (parameters) {
      // Delete existing parameters
      await TemplateParameter.destroy({
        where: { templateId: template.id }
      });

      // Create new parameters
      const parameterPromises = parameters.map(param => 
        TemplateParameter.create({
          templateId: template.id,
          name: param.name,
          type: param.type,
          isMandatory: param.isMandatory,
          sequenceOrder: param.sequenceOrder,
          minValue: param.minValue,
          maxValue: param.maxValue,
          dropdownOptions: param.dropdownOptions,
          acceptableValues: param.acceptableValues,
          maxLength: param.maxLength,
          validationPattern: param.validationPattern
        })
      );

      await Promise.all(parameterPromises);
    }

    // Fetch the complete updated template with parameters
    const updatedTemplate = await TestTemplate.findByPk(template.id, {
      include: [{
        model: TemplateParameter,
        as: 'parameters',
        order: [['sequenceOrder', 'ASC']]
      }]
    });

    res.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete template (Admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const template = await TestTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await template.destroy();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
