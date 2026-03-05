const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { TestExecution, TestResult, TestAssignment, TestTemplate, TemplateParameter, User, Report } = require('../models');
const { authenticateToken, authorizeQA, authorizeCompany } = require('../middleware/auth');

const router = express.Router();

// Generate report number
const generateReportNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = process.env.REPORT_NUMBER_PREFIX || 'TST';
  
  // Get the last report number for this year
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

// Generate PDF report
const generatePDFReport = async (execution, reportNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const reportsDir = path.join(__dirname, '../reports');
      
      // Ensure reports directory exists
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${reportNumber}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const stream = fs.createWriteStream(filepath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('TEST REPORT', 50, 50, { align: 'center' });
      doc.fontSize(12).text(process.env.COMPANY_NAME || 'Testing Company', 50, 80, { align: 'center' });
      
      // Report details
      doc.fontSize(14).text(`Report Number: ${reportNumber}`, 50, 120);
      doc.text(`Test Name: ${execution.assignment.template.name}`, 50, 140);
      doc.text(`Category: ${execution.assignment.template.category.toUpperCase()}`, 50, 160);
      doc.text(`Batch Number: ${execution.assignment.batchNumber}`, 50, 180);
      doc.text(`Product Name: ${execution.assignment.productName}`, 50, 200);
      
      // Personnel
      doc.text(`Tester: ${execution.tester.firstName} ${execution.tester.lastName}`, 50, 230);
      if (execution.qaManager) {
        doc.text(`QA Manager: ${execution.qaManager.firstName} ${execution.qaManager.lastName}`, 50, 250);
      }
      
      // Dates
      doc.text(`Test Date: ${new Date(execution.startedAt).toLocaleDateString()}`, 50, 280);
      if (execution.submittedAt) {
        doc.text(`Submitted: ${new Date(execution.submittedAt).toLocaleDateString()}`, 50, 300);
      }
      if (execution.approvedAt) {
        doc.text(`Approved: ${new Date(execution.approvedAt).toLocaleDateString()}`, 50, 320);
      }

      // Overall Status
      doc.fontSize(16).text(`Overall Status: ${execution.overallStatus.toUpperCase()}`, 50, 360, {
        fillColor: execution.overallStatus === 'pass' ? 'green' : 'red'
      });

      // Parameters table
      doc.fillColor('black').fontSize(14).text('Test Parameters:', 50, 400);
      
      let yPosition = 430;
      
      // Table headers
      doc.fontSize(10);
      doc.text('Parameter', 50, yPosition);
      doc.text('Observed Value', 200, yPosition);
      doc.text('Result', 350, yPosition);
      doc.text('Comments', 450, yPosition);
      
      // Draw header line
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      yPosition += 25;

      // Table rows
      execution.results.forEach((result) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(result.parameter.name, 50, yPosition);
        doc.text(result.observedValue, 200, yPosition);
        doc.fillColor(result.result === 'pass' ? 'green' : 'red')
           .text(result.result.toUpperCase(), 350, yPosition)
           .fillColor('black');
        doc.text(result.comments || '-', 450, yPosition);
        
        yPosition += 20;
      });

      // Comments section
      if (execution.testerComments || execution.qaComments) {
        yPosition += 20;
        doc.fontSize(12).text('Comments:', 50, yPosition);
        yPosition += 20;
        
        if (execution.testerComments) {
          doc.fontSize(10).text(`Tester: ${execution.testerComments}`, 50, yPosition);
          yPosition += 30;
        }
        
        if (execution.qaComments) {
          doc.fontSize(10).text(`QA Manager: ${execution.qaComments}`, 50, yPosition);
          yPosition += 30;
        }
      }

      // Signature section
      yPosition += 40;
      doc.fontSize(12).text('Signatures:', 50, yPosition);
      yPosition += 30;
      
      doc.text('Tester: ________________________', 50, yPosition);
      doc.text('QA Manager: ________________________', 300, yPosition);
      
      yPosition += 40;
      doc.text('Date: ________________________', 50, yPosition);
      doc.text('Date: ________________________', 300, yPosition);

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

// Generate report (QA Manager or Admin only)
router.post('/generate/:executionId', authenticateToken, authorizeQA, async (req, res) => {
  try {
    const execution = await TestExecution.findByPk(req.params.executionId, {
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

    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    // Check if approved
    if (!execution.approvedAt) {
      return res.status(400).json({ message: 'Test must be approved before generating report' });
    }

    // Check if report already exists
    const existingReport = await Report.findOne({
      where: { executionId: execution.id }
    });

    if (existingReport) {
      return res.status(400).json({ 
        message: 'Report already exists',
        reportNumber: existingReport.reportNumber
      });
    }

    // Generate report number
    const reportNumber = await generateReportNumber();

    // Generate PDF
    const filePath = await generatePDFReport(execution, reportNumber);

    // Save report record
    const report = await Report.create({
      executionId: execution.id,
      reportNumber,
      filePath,
      generatedBy: req.user.id
    });

    res.status(201).json({
      message: 'Report generated successfully',
      report: {
        id: report.id,
        reportNumber: report.reportNumber,
        generatedAt: report.generatedAt
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports list
router.get('/', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const { page = 1, limit = 10, reportNumber, testerId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (reportNumber) {
      whereClause.reportNumber = {
        [require('sequelize').Op.iLike]: `%${reportNumber}%`
      };
    }

    const includeClause = [
      {
        model: TestExecution,
        as: 'execution',
        include: [
          {
            model: TestAssignment,
            as: 'assignment',
            include: [{
              model: TestTemplate,
              as: 'template',
              attributes: ['name', 'category']
            }]
          },
          {
            model: User,
            as: 'tester',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            where: testerId ? { id: testerId } : undefined
          }
        ]
      },
      {
        model: User,
        as: 'generator',
        attributes: ['firstName', 'lastName', 'email']
      }
    ];

    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: includeClause
    });

    res.json({
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download report
router.get('/download/:reportNumber', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const report = await Report.findOne({
      where: { reportNumber: req.params.reportNumber }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ message: 'Report file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.pdf"`);
    
    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get report details
router.get('/:reportNumber', authenticateToken, authorizeCompany, async (req, res) => {
  try {
    const report = await Report.findOne({
      where: { reportNumber: req.params.reportNumber },
      include: [
        {
          model: TestExecution,
          as: 'execution',
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
        },
        {
          model: User,
          as: 'generator',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
