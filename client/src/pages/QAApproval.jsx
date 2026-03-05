import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { executionsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { Eye, CheckCircle, XCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import QAReviewModal from '../components/qa/QAReviewModal';
import ExecutionView from '../components/executions/ExecutionView';

const QAApproval = () => {
  const { hasRole } = useAuthStore();
  const [executions, setExecutions] = useState([]);
  const [allExecutions, setAllExecutions] = useState([]); // For stats calculation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'view'
  const [filter, setFilter] = useState('submitted');

  useEffect(() => {
    if (hasRole('qa_manager')) {
      fetchExecutions();
      fetchAllExecutions(); // Fetch all executions for stats
    }
  }, [filter, hasRole]);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await executionsAPI.getExecutions(params);
      console.log('QA Executions response:', response.data);
      setExecutions(response.data.executions);
    } catch (err) {
      setError('Failed to load test executions');
      console.error('QA Executions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExecutions = async () => {
    try {
      const response = await executionsAPI.getExecutions({}); // No filter to get all
      setAllExecutions(response.data.executions);
    } catch (err) {
      console.error('Failed to fetch all executions for stats:', err);
    }
  };

  const handleViewExecution = (execution) => {
    setSelectedExecution(execution);
    setViewMode('view');
  };

  const handleReviewExecution = (execution) => {
    setSelectedExecution(execution);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setSelectedExecution(null);
    fetchExecutions();
    fetchAllExecutions(); // Refresh stats as well
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedExecution(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallResultIcon = (result) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityLevel = (execution) => {
    const daysSinceSubmission = execution.submittedAt 
      ? Math.floor((new Date() - new Date(execution.submittedAt)) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysSinceSubmission > 2) return 'high';
    if (daysSinceSubmission > 1) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!hasRole('qa_manager')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to access QA approval functions.</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'view') {
    return (
      <ExecutionView
        execution={selectedExecution}
        onBack={handleBack}
      />
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">QA Approval</h1>
          <p className="text-gray-600 mt-1">
            Review and approve test executions submitted by testers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allExecutions.filter(e => e.status === 'submitted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allExecutions.filter(e => e.status === 'approved').length}
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
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allExecutions.filter(e => e.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allExecutions.length > 0 
                    ? Math.round((allExecutions.filter(e => e.overallResult === 'PASS').length / allExecutions.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'submitted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('submitted')}
        >
          Pending Review
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Executions List */}
      <div className="space-y-4">
        {executions.map((execution) => {
          const priority = getPriorityLevel(execution);
          const daysSinceSubmission = execution.submittedAt 
            ? Math.floor((new Date() - new Date(execution.submittedAt)) / (1000 * 60 * 60 * 24))
            : 0;

          return (
            <Card key={execution.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {execution.assignment?.template?.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(execution.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                          {execution.status.replace('_', ' ')}
                        </span>
                      </div>
                      {execution.status === 'submitted' && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(priority)}`}>
                          {priority} priority
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Product:</span>
                        <p className="text-gray-600">{execution.assignment?.productName}</p>
                        <p className="text-gray-500">Batch: {execution.assignment?.batchNumber}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Tester:</span>
                        <p className="text-gray-600">
                          {execution.tester?.firstName} {execution.tester?.lastName}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Result:</span>
                        <div className="flex items-center space-x-1">
                          {getOverallResultIcon(execution.overallResult)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            execution.overallResult === 'PASS' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {execution.overallResult}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Submitted:</span>
                        <p className="text-gray-600">
                          {execution.submittedAt 
                            ? new Date(execution.submittedAt).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </p>
                        {execution.status === 'submitted' && daysSinceSubmission > 0 && (
                          <p className="text-xs text-orange-600">
                            {daysSinceSubmission} day{daysSinceSubmission > 1 ? 's' : ''} ago
                          </p>
                        )}
                      </div>
                    </div>

                    {execution.qaComments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">QA Comments:</span>
                        </div>
                        <p className="text-sm text-gray-600">{execution.qaComments}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewExecution(execution)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    
                    {execution.status === 'submitted' && (
                      <Button
                        size="sm"
                        onClick={() => handleReviewExecution(execution)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {executions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'submitted' ? 'No pending reviews' : 
             filter === 'all' ? 'No test executions' : 
             `No ${filter} executions`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'submitted' 
              ? 'Test executions will appear here when testers submit their results for review.'
              : 'Test executions will appear here based on your selected filter.'}
          </p>
        </div>
      )}

      {/* QA Review Modal */}
      {showReviewModal && selectedExecution && (
        <QAReviewModal
          execution={selectedExecution}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

export default QAApproval;
