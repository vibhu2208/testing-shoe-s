import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { reportsAPI } from '../../lib/api';
import { FileText, X, CheckCircle, XCircle, Download } from 'lucide-react';

const ReportGenerationModal = ({ executions, onSuccess, onCancel }) => {
  const [selectedExecutions, setSelectedExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReports, setGeneratedReports] = useState([]);

  const handleExecutionToggle = (executionId) => {
    setSelectedExecutions(prev => 
      prev.includes(executionId)
        ? prev.filter(id => id !== executionId)
        : [...prev, executionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExecutions.length === executions.length) {
      setSelectedExecutions([]);
    } else {
      setSelectedExecutions(executions.map(e => e.id));
    }
  };

  const handleGenerateReports = async () => {
    if (selectedExecutions.length === 0) {
      setError('Please select at least one execution to generate reports');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const reports = [];

      // Generate reports one by one
      for (const executionId of selectedExecutions) {
        try {
          const response = await reportsAPI.generateReport(executionId);
          reports.push(response.data.report);
        } catch (err) {
          console.error(`Failed to generate report for execution ${executionId}:`, err);
          // Continue with other reports even if one fails
        }
      }

      setGeneratedReports(reports);
      
      if (reports.length === selectedExecutions.length) {
        // All reports generated successfully
        setTimeout(() => {
          onSuccess();
        }, 2000); // Show success message for 2 seconds
      } else {
        setError(`Generated ${reports.length} out of ${selectedExecutions.length} reports. Some reports failed to generate.`);
      }
    } catch (err) {
      setError('Failed to generate reports');
      console.error('Generate reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await reportsAPI.downloadReport(reportId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'test-report.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
      console.error('Download report error:', err);
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Test Reports</h2>
            <p className="text-gray-600 mt-1">Select approved test executions to generate PDF reports</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {generatedReports.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Successfully generated {generatedReports.length} report{generatedReports.length !== 1 ? 's' : ''}!
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between bg-white rounded p-3">
                      <div>
                        <span className="font-medium text-gray-900">{report.reportNumber}</span>
                        <p className="text-sm text-gray-600">
                          {report.execution?.assignment?.productName} - {report.execution?.assignment?.batchNumber}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadReport(report.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Selection Controls */}
          {generatedReports.length === 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Available Test Executions ({executions.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedExecutions.length === executions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Executions List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {executions.map((execution) => (
                  <Card 
                    key={execution.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedExecutions.includes(execution.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleExecutionToggle(execution.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedExecutions.includes(execution.id)}
                          onChange={() => handleExecutionToggle(execution.id)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {execution.assignment?.template?.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {execution.assignment?.productName} - Batch: {execution.assignment?.batchNumber}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getResultIcon(execution.overallResult)}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                execution.overallResult === 'PASS' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {execution.overallResult}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Tester:</span> {execution.tester?.firstName} {execution.tester?.lastName}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {execution.assignment?.template?.category?.replace('_', ' ')}
                            </div>
                            <div>
                              <span className="font-medium">Approved:</span> {formatDate(execution.approvedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Generation Summary */}
              {selectedExecutions.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {selectedExecutions.length} execution{selectedExecutions.length !== 1 ? 's' : ''} selected
                        </h4>
                        <p className="text-blue-800 text-sm">
                          {selectedExecutions.length} PDF report{selectedExecutions.length !== 1 ? 's' : ''} will be generated
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700">
                          Pass: {executions.filter(e => selectedExecutions.includes(e.id) && e.overallResult === 'PASS').length}
                        </p>
                        <p className="text-sm text-blue-700">
                          Fail: {executions.filter(e => selectedExecutions.includes(e.id) && e.overallResult === 'FAIL').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateReports}
                  disabled={loading || selectedExecutions.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Reports...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate {selectedExecutions.length} Report{selectedExecutions.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Close button after generation */}
          {generatedReports.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationModal;
