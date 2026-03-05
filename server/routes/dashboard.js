const express = require('express');
const { TestAssignment, TestExecution, TestTemplate, User, Report } = require('../models');
const { authenticateToken, authorizeCompany } = require('../middleware/auth');
const { Op, literal, fn, col } = require('sequelize');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const { startDate, endDate, testerId } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // Build tester filter for role-based access
    let testerFilter = {};
    let includeTesters = null;
    if (req.user.role === 'tester') {
      // For testers, we need to filter by the many-to-many relationship
      includeTesters = {
        model: User,
        as: 'testers',
        where: { id: req.user.id },
        required: true,
        attributes: []
      };
    } else if (testerId) {
      includeTesters = {
        model: User,
        as: 'testers',
        where: { id: testerId },
        required: true,
        attributes: []
      };
    }

    // Combine filters
    const assignmentFilter = { ...dateFilter, ...testerFilter };

    // Get assignment statistics
    let assignmentStats;
    if (includeTesters) {
      // For tester-specific queries, we need a different approach to avoid GROUP BY issues
      const assignmentIds = await TestAssignment.findAll({
        where: assignmentFilter,
        include: [includeTesters],
        attributes: ['id', 'status'],
        raw: false
      });

      // Group by status manually
      const statusCounts = {};
      assignmentIds.forEach(assignment => {
        const status = assignment.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      assignmentStats = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count.toString()
      }));
    } else {
      // For non-filtered queries, use the original approach
      assignmentStats = await TestAssignment.findAll({
        where: assignmentFilter,
        attributes: [
          'status',
          [fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        raw: true
      });
    }

    // Get execution statistics
    const executionFilter = req.user.role === 'tester' ? { testerId: req.user.id } : {};
    const executionStats = await TestExecution.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: executionFilter,
      group: ['status'],
      raw: true
    });

    // Get template usage statistics
    const templateStats = await TestTemplate.findAll({
      attributes: [
        'id',
        'name',
        'category'
      ],
      include: [{
        model: TestAssignment,
        as: 'assignments',
        attributes: [],
        where: testerFilter,
        required: false
      }],
      limit: 10
    });

    // Get recent activity
    let recentAssignmentsQuery = {
      where: assignmentFilter,
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: TestTemplate,
          as: 'template',
          attributes: ['name', 'category']
        },
        {
          model: User,
          as: 'tester',
          attributes: ['firstName', 'lastName']
        },
        {
          model: User,
          as: 'testers',
          attributes: ['firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    };

    if (includeTesters) {
      recentAssignmentsQuery.include.push(includeTesters);
    }

    const recentAssignments = await TestAssignment.findAll(recentAssignmentsQuery);

    // Format statistics
    const formattedAssignmentStats = {
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };

    assignmentStats.forEach(stat => {
      formattedAssignmentStats[stat.status] = parseInt(stat.count);
    });

    const formattedExecutionStats = {
      pass: 0,
      fail: 0
    };

    executionStats.forEach(stat => {
      formattedExecutionStats[stat.status] = parseInt(stat.count);
    });

    // Calculate totals
    const totalAssignments = Object.values(formattedAssignmentStats).reduce((sum, count) => sum + count, 0);
    const totalExecutions = Object.values(formattedExecutionStats).reduce((sum, count) => sum + count, 0);

    // Get pending approvals (for QA dashboard)
    let pendingApprovals = 0;
    if (['admin', 'qa_manager'].includes(req.user.role)) {
      pendingApprovals = await TestExecution.count({
        where: {
          submittedAt: { [Op.ne]: null },
          approvedAt: null,
          rejectedAt: null
        }
      });
    }

    // Get reports count
    const reportsCount = await Report.count();

    res.json({
      assignments: {
        ...formattedAssignmentStats,
        total: totalAssignments
      },
      executions: {
        ...formattedExecutionStats,
        total: totalExecutions
      },
      pendingApprovals,
      reportsGenerated: reportsCount,
      topTemplates: templateStats.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        usageCount: parseInt(template.usageCount)
      })),
      recentActivity: recentAssignments
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user performance metrics (Admin/QA only)
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'qa_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    // Get tester performance
    const testerPerformance = await User.findAll({
      where: { role: 'tester', isActive: true },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email'
      ],
      include: [
        {
          model: TestAssignment,
          as: 'assignedTests',
          where: dateFilter,
          required: false,
          attributes: [
            'status',
            [fn('COUNT', '*'), 'count']
          ],
          group: ['status']
        },
        {
          model: TestExecution,
          as: 'testExecutions',
          required: false,
          attributes: [
            'overallStatus',
            [fn('COUNT', '*'), 'count'],
            [fn('AVG', 
              fn('EXTRACT', 
                literal('EPOCH FROM ("submittedAt" - "startedAt")')
              )
            ), 'avgCompletionTime']
          ],
          group: ['overallStatus']
        }
      ]
    });

    // Get QA performance
    const qaPerformance = await User.findAll({
      where: { role: 'qa_manager', isActive: true },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email'
      ],
      include: [{
        model: TestExecution,
        as: 'qaApprovals',
        required: false,
        where: {
          [Op.or]: [
            { approvedAt: { [Op.ne]: null } },
            { rejectedAt: { [Op.ne]: null } }
          ]
        },
        attributes: [
          [fn('COUNT', '*'), 'totalReviewed'],
          [fn('SUM', 
            literal('CASE WHEN "approvedAt" IS NOT NULL THEN 1 ELSE 0 END')
          ), 'approved'],
          [fn('AVG', 
            fn('EXTRACT', 
              literal('EPOCH FROM (COALESCE("approvedAt", "rejectedAt") - "submittedAt")')
            )
          ), 'avgReviewTime']
        ]
      }]
    });

    res.json({
      testers: testerPerformance,
      qaManagers: qaPerformance
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending data
router.get('/trends', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Build filter for tester role
    let assignmentWhereClause = {
      createdAt: { [Op.gte]: startDate }
    };
    
    let executionWhereClause = {
      submittedAt: { [Op.gte]: startDate }
    };

    // For testers, filter by their assignments through the many-to-many relationship
    if (req.user.role === 'tester') {
      // Get assignments where this tester is assigned
      const testerAssignments = await TestAssignment.findAll({
        where: assignmentWhereClause,
        include: [{
          model: User,
          as: 'testers',
          where: { id: req.user.id },
          required: true,
          attributes: []
        }],
        attributes: ['id']
      });
      
      const assignmentIds = testerAssignments.map(a => a.id);
      assignmentWhereClause.id = { [Op.in]: assignmentIds };
      executionWhereClause.testerId = req.user.id;
    }

    // Get daily assignment trends
    const assignmentTrends = await TestAssignment.findAll({
      where: assignmentWhereClause,
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        'status',
        [fn('COUNT', '*'), 'count']
      ],
      group: [
        fn('DATE', col('createdAt')),
        'status'
      ],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    // Get daily execution trends
    const executionTrends = await TestExecution.findAll({
      where: executionWhereClause,
      attributes: [
        [fn('DATE', col('submittedAt')), 'date'],
        'overallStatus',
        [fn('COUNT', '*'), 'count']
      ],
      group: [
        fn('DATE', col('submittedAt')),
        'overallStatus'
      ],
      order: [[fn('DATE', col('submittedAt')), 'ASC']],
      raw: true
    });

    res.json({
      assignments: assignmentTrends,
      executions: executionTrends
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
