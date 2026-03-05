const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Generate Certificate of Analysis (CoA) PDF Report
 * Based on VIROLA ASSURE LABS format requirements
 */

// Static disclaimer text for page 2
const DISCLAIMER_TEXT = `
<div class="disclaimer-content">
  <h3>DISCLAIMER</h3>
  
  <h4>1. Non-Warranty Statement</h4>
  <p>This Certificate of Analysis is provided for informational purposes only and does not constitute a warranty, guarantee, or certification of the product's fitness for any particular purpose or compliance with any specific standards or regulations.</p>
  
  <h4>2. Scope Limitation</h4>
  <p>The testing results contained in this certificate are limited to the specific sample(s) tested and the parameters evaluated. Results may not be representative of the entire batch or production lot.</p>
  
  <h4>3. Independent Verification</h4>
  <p>Recipients are advised to conduct their own independent testing and verification to ensure the product meets their specific requirements and applicable standards.</p>
  
  <h4>4. Limitation of Liability</h4>
  <p>VIROLA ASSURE LABS shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this certificate or reliance on the information contained herein.</p>
  
  <h4>5. No Endorsement or Certification</h4>
  <p>This certificate does not constitute an endorsement, certification, or approval of the product by VIROLA ASSURE LABS or any regulatory authority.</p>
  
  <h4>6. Indemnity</h4>
  <p>The recipient agrees to indemnify and hold harmless VIROLA ASSURE LABS from any claims, damages, or liabilities arising from the use of this certificate.</p>
  
  <h4>7. Jurisdiction</h4>
  <p>This certificate and any disputes arising from its use shall be governed by the laws of the jurisdiction where VIROLA ASSURE LABS is located.</p>
  
  <h4>8. Internal Use Emphasis</h4>
  <p>This certificate is intended for internal quality assurance purposes only and should not be used for regulatory compliance or commercial certification without proper validation.</p>
  
  <h4>9. Important Notice</h4>
  <p>Any alterations, modifications, or unauthorized reproduction of this certificate will void its validity. For questions regarding this certificate, please contact VIROLA ASSURE LABS directly.</p>
</div>
`;

/**
 * Build HTML template for CoA report
 * @param {Object} data - Report data object
 * @returns {string} Complete HTML string
 */
function buildCoAHTML(data) {
  // Build parameter rows
  const paramRows = data.parameters.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.standard}</td>
      <td style="color: ${p.isPassed ? '#28a745' : '#dc3545'}; font-weight: bold;">
        ${p.result}
      </td>
    </tr>
  `).join('');

  // Build signature blocks with digital signatures if available
  const buildSignatureBlock = (title, name, position, signatureBase64) => {
    const signatureImg = signatureBase64 ? 
      `<img src="data:image/png;base64,${signatureBase64}" alt="Signature" style="max-height: 40px; margin-bottom: 5px;">` : 
      '<div style="height: 40px; margin-bottom: 5px;"></div>';
    
    return `
      <div class="sig-line">
        <div style="text-align: center;">
          ${signatureImg}
          <div style="border-top: 1px solid #000; margin-bottom: 5px;"></div>
          <strong>${title}</strong><br>
          <small>${name || '_____________'}</small><br>
          <small style="font-style: italic;">${position}</small>
        </div>
      </div>
    `;
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        font-size: 11px; 
        margin: 0; 
        padding: 0;
        line-height: 1.4;
      }
      
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm 15mm;
        margin: 0 auto;
        background: white;
        box-sizing: border-box;
      }
      
      .header { 
        text-align: center; 
        border-bottom: 3px solid #003366; 
        padding-bottom: 15px; 
        margin-bottom: 20px;
        position: relative;
      }
      
      .company-name { 
        font-size: 24px; 
        font-weight: bold; 
        color: #003366; 
        margin-bottom: 5px;
      }
      
      .company-subtitle {
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
      }
      
      .document-title {
        font-size: 18px;
        font-weight: bold;
        color: #003366;
        margin-top: 10px;
      }
      
      .tuv-logo {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 10px;
        color: #666;
        border: 1px solid #ccc;
        padding: 5px;
        background: #f8f9fa;
      }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
      }
      
      th { 
        background-color: #003366; 
        color: white; 
        padding: 8px 6px; 
        font-weight: bold;
        text-align: left;
      }
      
      td { 
        border: 1px solid #ddd; 
        padding: 6px; 
        vertical-align: top;
      }
      
      .product-details td {
        background-color: #f8f9fa;
      }
      
      .product-details td:nth-child(odd) {
        background-color: #e9ecef;
        font-weight: bold;
      }
      
      .result-pass { 
        background-color: #d4edda !important; 
        font-weight: bold; 
        color: #155724 !important;
        text-align: center;
      }
      
      .result-fail { 
        background-color: #f8d7da !important; 
        font-weight: bold; 
        color: #721c24 !important;
        text-align: center;
      }
      
      .signature-section {
        margin-top: 30px;
        page-break-inside: avoid;
      }
      
      .signature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 15px;
      }
      
      .sig-line {
        margin-bottom: 20px;
      }
      
      .footer-note {
        font-size: 9px;
        color: #666;
        font-style: italic;
        text-align: center;
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .disclaimer {
        font-size: 10px;
        color: #333;
        line-height: 1.5;
      }
      
      .disclaimer h3 {
        color: #003366;
        font-size: 16px;
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #003366;
        padding-bottom: 10px;
      }
      
      .disclaimer h4 {
        color: #003366;
        font-size: 12px;
        margin-top: 15px;
        margin-bottom: 8px;
      }
      
      .disclaimer p {
        margin-bottom: 10px;
        text-align: justify;
      }
      
      @media print {
        .page {
          margin: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <!-- PAGE 1: Certificate of Analysis -->
    <div class="page">
      <div class="header">
        <div class="tuv-logo">TÜV SÜD<br>Certified Lab</div>
        <div class="company-name">VIROLA ASSURE LABS</div>
        <div class="company-subtitle">A Division of VIROLA GROUP</div>
        <div class="document-title">CERTIFICATE OF ANALYSIS (CoA)</div>
      </div>

      <!-- Product & Batch Details Table -->
      <table class="product-details">
        <tr>
          <td><strong>Product Name</strong></td>
          <td>${data.productName}</td>
          <td><strong>REPORT/TESTNAME</strong></td>
          <td>${data.reportNo} — ${data.testName}</td>
        </tr>
        <tr>
          <td><strong>ARTICLE NO.</strong></td>
          <td>${data.articleNo}</td>
          <td><strong>Date</strong></td>
          <td>${data.testDate}</td>
        </tr>
        <tr>
          <td><strong>SOLE</strong></td>
          <td>${data.soleMaterial}</td>
          <td><strong>CUSTOMER</strong></td>
          <td>${data.customerCode}</td>
        </tr>
      </table>

      <!-- Testing Parameters Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">TESTING PARAMETERS</th>
            <th style="width: 30%;">STANDARD PARAMETERS</th>
            <th style="width: 30%;">RESULTS</th>
          </tr>
        </thead>
        <tbody>
          ${paramRows}
        </tbody>
      </table>

      <!-- Overall Result -->
      <table>
        <tr class="${data.overallResult === 'PASS' ? 'result-pass' : 'result-fail'}">
          <td style="width: 20%; font-weight: bold; font-size: 14px;">RESULT</td>
          <td style="font-weight: bold; font-size: 14px;">
            ${data.overallResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}
          </td>
        </tr>
      </table>

      <!-- Testing Method -->
      ${data.testingMethod ? `
      <table style="margin-top: 10px;">
        <tr>
          <td style="background-color: #f8f9fa; font-weight: bold; width: 20%;">Testing Method:</td>
          <td>${data.testingMethod}</td>
        </tr>
      </table>
      ` : ''}

      <!-- Signature Section -->
      <div class="signature-section">
        <h3 style="color: #003366; margin-bottom: 15px;">AUTHORIZATION & APPROVAL</h3>
        
        <div class="signature-grid">
          ${buildSignatureBlock('Tested By', data.testedBy, 'Senior Lab Analyst', data.signatures?.testedBy)}
          ${buildSignatureBlock('Reviewed By', '', 'Quality Assurance Manager', data.signatures?.reviewedBy)}
          ${buildSignatureBlock('Reviewed By', '', 'Product Manager / QA Manager', data.signatures?.productManager)}
          ${buildSignatureBlock('Approved By (L1)', data.approvedByL1, 'Management Approval Level 1', data.signatures?.approvedByL1)}
          ${buildSignatureBlock('Approved By (L2)', data.approvedByL2, 'Management Approval Level 2', data.signatures?.approvedByL2)}
        </div>
      </div>

      <div class="footer-note">
        This Certificate of Analysis is issued for informational purposes only.<br>
        Please read the disclaimer on the reverse page before use.
      </div>
    </div>

    <!-- PAGE 2: Disclaimer -->
    <div class="page page-break">
      <div class="disclaimer">
        ${DISCLAIMER_TEXT}
      </div>
    </div>
  </body>
  </html>`;
}

/**
 * Generate CoA PDF using Puppeteer
 * @param {Object} data - Report data object
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateCoAPDF(data) {
  let browser;
  try {
    // Build HTML content
    const html = buildCoAHTML(data);
    
    // Launch Puppeteer
    browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '20mm', 
        bottom: '20mm', 
        left: '15mm', 
        right: '15mm' 
      },
      preferCSSPageSize: true
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Save PDF buffer to file system
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} reportNumber - Report number for filename
 * @returns {Promise<string>} File path
 */
async function savePDFToFile(pdfBuffer, reportNumber) {
  try {
    const reportsDir = path.join(__dirname, '../reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `CoA_${reportNumber}.pdf`;
    const filepath = path.join(reportsDir, filename);
    
    // Write buffer to file
    await fs.promises.writeFile(filepath, pdfBuffer);
    
    return filepath;
  } catch (error) {
    console.error('File save error:', error);
    throw new Error(`Failed to save PDF file: ${error.message}`);
  }
}

/**
 * Transform execution data to CoA report format
 * @param {Object} execution - Test execution with all related data
 * @returns {Object} Formatted data for CoA report
 */
function transformExecutionToCoAData(execution) {
  // Generate report number in format: DD-MM-YY
  const now = new Date();
  const reportNo = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear().toString().slice(-2)}`;
  
  // Transform parameters
  const parameters = execution.results.map(result => ({
    name: result.parameter.name,
    standard: result.parameter.expectedValue || result.parameter.threshold || 'OK',
    result: result.observedValue,
    isPassed: result.result === 'pass'
  }));
  
  // Calculate overall result
  const overallResult = execution.overallResult || (parameters.every(p => p.isPassed) ? 'PASS' : 'FAIL');
  
  return {
    reportNo,
    testName: execution.assignment.template.name.toUpperCase(),
    testDate: now.toLocaleDateString('en-GB'),
    productName: execution.assignment.productName || 'N/A',
    articleNo: execution.assignment.articleNumber || execution.assignment.batchNumber || 'N/A',
    soleMaterial: execution.assignment.soleMaterial || 'N/A',
    customerCode: execution.assignment.customerCode || 'N/A',
    testingMethod: execution.assignment.template.testingMethod || execution.assignment.template.category,
    testedBy: `${execution.tester.firstName} ${execution.tester.lastName}`,
    approvedByL1: execution.qaManager ? `${execution.qaManager.firstName} ${execution.qaManager.lastName}` : '',
    approvedByL2: '', // Can be populated from additional approval data
    signatures: {
      testedBy: null, // Can be populated from stored signature data
      approvedByL1: null,
      approvedByL2: null
    },
    parameters,
    attachments: [], // Can be populated from stored attachments
    overallResult
  };
}

module.exports = {
  generateCoAPDF,
  savePDFToFile,
  transformExecutionToCoAData,
  buildCoAHTML
};
