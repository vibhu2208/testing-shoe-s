const express = require('express');
const { body, validationResult } = require('express-validator');
const { TestExecution, TestResult, TestAssignment, TestTemplate, TemplateParameter, User, Report } = require('../models');
const { authenticateToken, authorizeTester, authorizeQA, authorizeCompany } = require('../middleware/auth');
const { generateCoAPDF, savePDFToFile, transformExecutionToCoAData } = require('../utils/coaReportGenerator');

const router = express.Router();

// Get executions (role-based access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, testerId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Role-based filtering
    if (req.user.role === 'tester') {
      whereClause.testerId = req.user.id;
    } else if (testerId && ['admin', 'qa_manager', 'company'].includes(req.user.role)) {
      whereClause.testerId = testerId;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: executions } = await TestExecution.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: TestAssignment,
          as: 'assignment',
          include: [{
            model: TestTemplate,
            as: 'template',
            attributes: ['id', 'name', 'category'],
            include: [{
              model: TemplateParameter,
              as: 'parameters',
              order: [['sequenceOrder', 'ASC']]
            }]
          }]
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'qaManager',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: TestResult,
          as: 'results',
          include: [{
            model: TemplateParameter,
            as: 'parameter'
          }]
        }
      ]
    });

    res.json({
      executions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start test execution (Tester only)
router.post('/start/:assignmentId', authenticateToken, authorizeTester, async (req, res) => {
  try {
    const assignment = await TestAssignment.findByPk(req.params.assignmentId, {
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
          as: 'testers',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          through: { attributes: ['assignedAt'] }
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is assigned to this test (either old way or new way)
    const isAssigned = assignment.assignedTesterId === req.user.id || 
                      assignment.testers.some(tester => tester.id === req.user.id);
    
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this test' });
    }

    // Check if assignment is in correct status
    if (assignment.status !== 'assigned' && assignment.status !== 'in_progress') {
      return res.status(400).json({ message: 'Assignment cannot be started in current status' });
    }

    // Check if this specific tester already has an execution
    const existingExecution = await TestExecution.findOne({
      where: { 
        assignmentId: assignment.id,
        testerId: req.user.id
      }
    });

    if (existingExecution) {
      return res.status(400).json({ message: 'You have already started this test execution' });
    }

    // Update assignment status to in_progress if not already
    if (assignment.status === 'assigned') {
      await assignment.update({ status: 'in_progress' });
    }

    // Create execution record for this specific tester
    const execution = await TestExecution.create({
      assignmentId: assignment.id,
      testerId: req.user.id,
      status: 'in_progress'
    });

    res.status(201).json({
      message: 'Test execution started successfully',
      execution: {
        id: execution.id,
        assignmentId: execution.assignmentId,
        startedAt: execution.startedAt,
        assignment: assignment
      }
    });
  } catch (error) {
    console.error('Start execution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit test results (Tester only)
router.post('/:id/submit', [
  authenticateToken,
  authorizeTester,
  body('results').isArray({ min: 1 }),
  body('results.*.parameterId').isUUID(),
  body('results.*.observedValue').notEmpty(),
  body('testerComments').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const execution = await TestExecution.findByPk(req.params.id, {
      include: [{
        model: TestAssignment,
        as: 'assignment',
        include: [{
          model: TestTemplate,
          as: 'template',
          include: [{
            model: TemplateParameter,
            as: 'parameters'
          }]
        }]
      }]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    // Check if user owns this execution
    if (execution.testerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already submitted
    if (execution.submittedAt) {
      return res.status(400).json({ message: 'Test already submitted' });
    }

    const { results, testerComments, save, submit } = req.body;

    // Delete existing results to avoid duplicates
    await TestResult.destroy({
      where: { executionId: execution.id }
    });

    // Validate and process results
    const parameters = execution.assignment.template.parameters;
    let overallStatus = 'pass';

    const resultPromises = results.map(async (result) => {
      const parameter = parameters.find(p => p.id === result.parameterId);
      if (!parameter) {
        throw new Error(`Parameter ${result.parameterId} not found`);
      }

      let resultStatus = 'pass';

      // Auto-evaluate based on parameter type
      if (parameter.type === 'numeric') {
        const value = parseFloat(result.observedValue);
        if (isNaN(value)) {
          throw new Error(`Invalid numeric value for parameter ${parameter.name}`);
        }
        if (parameter.minValue !== null && value < parameter.minValue) {
          resultStatus = 'fail';
        }
        if (parameter.maxValue !== null && value > parameter.maxValue) {
          resultStatus = 'fail';
        }
      } else if (parameter.type === 'boolean') {
        const value = result.observedValue.toLowerCase();
        if (!['true', 'false', 'pass', 'fail', 'yes', 'no'].includes(value)) {
          throw new Error(`Invalid boolean value for parameter ${parameter.name}`);
        }
        if (['false', 'fail', 'no'].includes(value)) {
          resultStatus = 'fail';
        }
      } else if (parameter.type === 'dropdown') {
        if (!parameter.dropdownOptions.includes(result.observedValue)) {
          throw new Error(`Invalid dropdown value for parameter ${parameter.name}`);
        }
        if (parameter.acceptableValues && !parameter.acceptableValues.includes(result.observedValue)) {
          resultStatus = 'fail';
        }
      }

      if (resultStatus === 'fail') {
        overallStatus = 'fail';
      }

      return TestResult.create({
        executionId: execution.id,
        parameterId: result.parameterId,
        observedValue: result.observedValue,
        result: resultStatus,
        comments: result.comments
      });
    });

    await Promise.all(resultPromises);

    // Check if this is a save-only or final submission
    
    if (req.body.submit) {
      // Final submission
      await execution.update({
        overallResult: overallStatus.toUpperCase(),
        status: 'submitted',
        submittedAt: new Date(),
        testerComments
      });
      
      // Check if all assigned testers have submitted their results
      const assignment = await TestAssignment.findByPk(execution.assignmentId, {
        include: [{
          model: User,
          as: 'testers',
          attributes: ['id']
        }]
      });
      
      const allExecutions = await TestExecution.findAll({
        where: { assignmentId: execution.assignmentId },
        attributes: ['testerId', 'status']
      });
      
      const submittedTesters = allExecutions.filter(exec => exec.status === 'submitted').map(exec => exec.testerId);
      const assignedTesters = assignment.testers.map(tester => tester.id);
      
      // If all assigned testers have submitted, mark assignment as submitted
      const allSubmitted = assignedTesters.every(testerId => submittedTesters.includes(testerId));
      
      if (allSubmitted) {
        await execution.assignment.update({ status: 'submitted' });
      }
    } else {
      // Save progress only
      await execution.update({
        overallResult: overallStatus.toUpperCase(),
        testerComments
      });
    }

    res.json({
      message: req.body.submit ? 'Test results submitted successfully' : 'Test results saved successfully',
      execution: {
        id: execution.id,
        overallResult: overallStatus.toUpperCase(),
        status: execution.status,
        submittedAt: execution.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit execution error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get execution details
router.get('/:id', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const execution = await TestExecution.findByPk(req.params.id, {
      include: [
        {
          model: TestAssignment,
          as: 'assignment',
          include: [{
            model: TestTemplate,
            as: 'template',
            include: [{
              model: TemplateParameter,
              as: 'parameters',
              order: [['sequenceOrder', 'ASC']]
            }]
          }]
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'qaManager',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: TestResult,
          as: 'results',
          include: [{
            model: TemplateParameter,
            as: 'parameter'
          }]
        }
      ]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    // Check access permissions
    if (req.user.role === 'tester' && execution.testerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ execution });
  } catch (error) {
    console.error('Get execution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// QA approve/reject execution
router.put('/:id/qa-review', [
  authenticateToken,
  authorizeQA,
  body('action').isIn(['approve', 'reject']),
  body('qaComments').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const execution = await TestExecution.findByPk(req.params.id, {
      include: [{
        model: TestAssignment,
        as: 'assignment'
      }]
    });

    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    // Check if submitted
    if (!execution.submittedAt) {
      return res.status(400).json({ message: 'Test not yet submitted' });
    }

    // Check if already reviewed
    if (execution.approvedAt || execution.rejectedAt) {
      return res.status(400).json({ message: 'Test already reviewed' });
    }

    const { action, qaComments } = req.body;

    const updateData = {
      qaManagerId: req.user.id,
      qaComments
    };

    if (action === 'approve') {
      updateData.approvedAt = new Date();
      updateData.status = 'approved';
      updateData.isLocked = true;
      await execution.assignment.update({ status: 'approved' });
    } else {
      updateData.rejectedAt = new Date();
      updateData.status = 'rejected';
      await execution.assignment.update({ status: 'rejected' });
    }

    await execution.update(updateData);

    let reportInfo = null;

    // Auto-generate CoA report if approved
    if (action === 'approve') {
      try {
        // Check if report already exists
        const existingReport = await Report.findOne({
          where: { executionId: execution.id }
        });

        if (!existingReport) {
          // Fetch complete execution data for report generation
          const fullExecution = await TestExecution.findByPk(execution.id, {
            include: [
              {
                model: TestAssignment,
                as: 'assignment',
                include: [{
                  model: TestTemplate,
                  as: 'template'
                }]
              },
              {
                model: User,
                as: 'tester',
                attributes: ['firstName', 'lastName', 'email']
              },
              {
                model: User,
                as: 'qaManager',
                attributes: ['firstName', 'lastName', 'email']
              },
              {
                model: TestResult,
                as: 'results',
                include: [{
                  model: TemplateParameter,
                  as: 'parameter'
                }]
              }
            ]
          });

          // Generate report number
          const generateReportNumber = async () => {
            const year = new Date().getFullYear();
            const prefix = process.env.REPORT_NUMBER_PREFIX || 'TST';
            
            const lastReport = await Report.findOne({
              where: {
                reportNumber: {
                  [require('sequelize').Op.like]: `${prefix}-${year}-%`
                }
              },
              order: [['reportNumber', 'DESC']]
            });

            let sequence = 1;
            if (lastReport) {
              const lastSequence = parseInt(lastReport.reportNumber.split('-')[2]);
              sequence = lastSequence + 1;
            }

            return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
          };

          const reportNumber = await generateReportNumber();

          // Transform execution data to CoA format
          const coaData = transformExecutionToCoAData(fullExecution);
          coaData.reportNo = reportNumber;

          // Generate CoA PDF
          const pdfBuffer = await generateCoAPDF(coaData);
          const filePath = await savePDFToFile(pdfBuffer, reportNumber);

          // Save report record
          const report = await Report.create({
            executionId: execution.id,
            reportNumber,
            filePath,
            generatedBy: req.user.id
          });

          reportInfo = {
            id: report.id,
            reportNumber: report.reportNumber,
            generated: true
          };
        } else {
          reportInfo = {
            id: existingReport.id,
            reportNumber: existingReport.reportNumber,
            generated: false,
            message: 'Report already exists'
          };
        }
      } catch (reportError) {
        console.error('Auto CoA report generation failed:', reportError);
        // Don't fail the approval if report generation fails
        reportInfo = {
          error: 'Report generation failed',
          message: reportError.message
        };
      }
    }

    res.json({
      message: `Test ${action}d successfully`,
      execution: {
        id: execution.id,
        action,
        reviewedAt: action === 'approve' ? updateData.approvedAt : updateData.rejectedAt
      },
      report: reportInfo
    });
  } catch (error) {
    console.error('QA review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all executions for a specific assignment (Admin/QA only)
router.get('/assignment/:assignmentId', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const executions = await TestExecution.findAll({
      where: { assignmentId: req.params.assignmentId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: TestAssignment,
          as: 'assignment',
          include: [{
            model: TestTemplate,
            as: 'template',
            attributes: ['id', 'name', 'category'],
            include: [{
              model: TemplateParameter,
              as: 'parameters',
              order: [['sequenceOrder', 'ASC']]
            }]
          }]
        },
        {
          model: User,
          as: 'tester',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'qaManager',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: TestResult,
          as: 'results',
          include: [{
            model: TemplateParameter,
            as: 'parameter'
          }]
        }
      ]
    });

    res.json({
      executions,
      totalExecutions: executions.length
    });
  } catch (error) {
    console.error('Get assignment executions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
