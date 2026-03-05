const { generateCoAPDF, transformExecutionToCoAData } = require('./utils/coaReportGenerator');
const fs = require('fs');
const path = require('path');

// Mock test data to verify CoA report generation
const mockExecutionData = {
  id: 'test-execution-id',
  overallResult: 'PASS',
  assignment: {
    productName: 'SYNTHETIC BARBRA NATURAL',
    articleNumber: '79027 NAVY',
    batchNumber: 'BATCH-001',
    soleMaterial: 'PU SOLE BEIGE',
    customerCode: 'DM',
    template: {
      name: 'MATERIAL ABRASION',
      category: 'SATRA TM 31',
      testingMethod: 'SATRA TM 31'
    }
  },
  tester: {
    firstName: 'Ravi',
    lastName: 'Kumar'
  },
  qaManager: {
    firstName: 'Suresh',
    lastName: 'Mehta'
  },
  results: [
    {
      parameter: {
        name: 'DRY - After 1600 Cycles',
        expectedValue: 'OK',
        threshold: 'OK'
      },
      observedValue: 'OK',
      result: 'pass'
    },
    {
      parameter: {
        name: 'DRY - After 3200 Cycles',
        expectedValue: 'OK',
        threshold: 'OK'
      },
      observedValue: 'OK',
      result: 'pass'
    },
    {
      parameter: {
        name: 'WET - After 1600 Cycles',
        expectedValue: 'OK',
        threshold: 'OK'
      },
      observedValue: 'OK',
      result: 'pass'
    }
  ]
};

async function testCoAReportGeneration() {
  try {
    console.log('🧪 Testing CoA Report Generation...');
    
    // Transform mock data
    const coaData = transformExecutionToCoAData(mockExecutionData);
    console.log('✅ Data transformation successful');
    console.log('📋 CoA Data:', JSON.stringify(coaData, null, 2));
    
    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfBuffer = await generateCoAPDF(coaData);
    console.log('✅ PDF generation successful');
    console.log('📊 PDF Buffer size:', pdfBuffer.length, 'bytes');
    
    // Save test PDF
    const testReportsDir = path.join(__dirname, 'test-reports');
    if (!fs.existsSync(testReportsDir)) {
      fs.mkdirSync(testReportsDir, { recursive: true });
    }
    
    const testFilePath = path.join(testReportsDir, 'test-coa-report.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log('✅ Test PDF saved to:', testFilePath);
    
    console.log('🎉 CoA Report Generation Test PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ CoA Report Generation Test FAILED:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCoAReportGeneration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCoAReportGeneration };
