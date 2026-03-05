import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { reportsAPI, executionsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { FileText, Download, Eye, Plus, Calendar, CheckCircle, XCircle } from 'lucide-react';
import ReportGenerationModal from '../components/reports/ReportGenerationModal';

const Reports = () => {
  const { hasRole } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [approvedExecutions, setApprovedExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
    if (hasRole('admin') || hasRole('qa_manager')) {
      fetchApprovedExecutions();
    }
  }, [filter, hasRole]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        // Add any specific filters if needed
      }
      const response = await reportsAPI.getReports(params);
      setReports(response.data.reports);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedExecutions = async () => {
    try {
      const response = await executionsAPI.getExecutions({ status: 'approved' });
      // Filter executions that don't have reports yet
      const executionsWithoutReports = response.data.executions.filter(execution => 
        !reports.some(report => report.executionId === execution.id)
      );
      setApprovedExecutions(executionsWithoutReports);
    } catch (err) {
      console.error('Failed to load approved executions:', err);
    }
  };

  const handleGenerateReport = () => {
    setShowGenerationModal(true);
  };

  const handleGenerationSuccess = () => {
    setShowGenerationModal(false);
    fetchReports();
    fetchApprovedExecutions();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage PDF reports for approved test executions
          </p>
        </div>
        {(hasRole('admin') || hasRole('qa_manager')) && approvedExecutions.length > 0 && (
          <Button onClick={handleGenerateReport}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.execution?.overallResult === 'PASS').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fail Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.execution?.overallResult === 'FAIL').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => {
                    const reportDate = new Date(r.createdAt);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && 
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available for Report Generation */}
      {(hasRole('admin') || hasRole('qa_manager')) && approvedExecutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for Report Generation</CardTitle>
            <CardDescription>
              Approved test executions that don't have reports yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    {approvedExecutions.length} approved test{approvedExecutions.length !== 1 ? 's' : ''} ready
                  </h4>
                  <p className="text-blue-800 text-sm mt-1">
                    These tests have been approved by QA and are ready for report generation
                  </p>
                </div>
                <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
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

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    {report.reportNumber}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {report.execution?.assignment?.template?.name}
                  </CardDescription>
                </div>
                {report.execution?.overallResult && (
                  <div className="flex items-center space-x-1">
                    {getResultIcon(report.execution.overallResult)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      report.execution.overallResult === 'PASS' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.execution.overallResult}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Product Details</h4>
                  <p className="text-sm text-gray-600">{report.execution?.assignment?.productName}</p>
                  <p className="text-sm text-gray-600">Batch: {report.execution?.assignment?.batchNumber}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Test Information</h4>
                  <p className="text-sm text-gray-600">
                    Tester: {report.execution?.tester?.firstName} {report.execution?.tester?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    Category: {report.execution?.assignment?.template?.category?.replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Report Details</h4>
                  <p className="text-sm text-gray-600">
                    Generated: {formatDate(report.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    By: {report.generatedBy?.firstName} {report.generatedBy?.lastName}
                  </p>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reports.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FileText className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports generated</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasRole('admin') || hasRole('qa_manager') 
              ? 'Reports will appear here once you generate them from approved test executions.'
              : 'Test reports will appear here once they are generated by administrators or QA managers.'}
          </p>
          {(hasRole('admin') || hasRole('qa_manager')) && approvedExecutions.length > 0 && (
            <div className="mt-6">
              <Button onClick={handleGenerateReport}>
                <Plus className="mr-2 h-4 w-4" />
                Generate First Report
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Report Generation Modal */}
      {showGenerationModal && (
        <ReportGenerationModal
          executions={approvedExecutions}
          onSuccess={handleGenerationSuccess}
          onCancel={() => setShowGenerationModal(false)}
        />
      )}
    </div>
  );
};

export default Reports;
