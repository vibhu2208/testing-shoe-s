import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { executionsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { Play, Eye, CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import TestExecutionForm from '../components/executions/TestExecutionForm';
import ExecutionView from '../components/executions/ExecutionView';

const Executions = () => {
  const { user, hasRole } = useAuthStore();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'execute', 'view'
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchExecutions();
  }, [filter]);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await executionsAPI.getExecutions(params);
      setExecutions(response.data.executions);
    } catch (err) {
      setError('Failed to load test executions');
      console.error('Executions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExecution = async (assignmentId) => {
    try {
      const response = await executionsAPI.startExecution(assignmentId);
      const execution = response.data.execution;
      setSelectedExecution(execution);
      setViewMode('execute');
    } catch (err) {
      setError('Failed to start test execution');
      console.error('Start execution error:', err);
    }
  };

  const handleViewExecution = (execution) => {
    setSelectedExecution(execution);
    setViewMode('view');
  };

  const handleExecutionSuccess = () => {
    setViewMode('list');
    fetchExecutions();
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedExecution(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
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
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
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

  const canContinueExecution = (execution) => {
    return hasRole('tester') && 
           execution.testerId === user?.id && 
           execution.status === 'in_progress';
  };

  if (viewMode === 'execute') {
    return (
      <TestExecutionForm
        execution={selectedExecution}
        onSuccess={handleExecutionSuccess}
        onCancel={handleBack}
      />
    );
  }

  if (viewMode === 'view') {
    return (
      <ExecutionView
        execution={selectedExecution}
        onBack={handleBack}
        onContinue={canContinueExecution(selectedExecution) ? () => setViewMode('execute') : null}
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
          <h1 className="text-3xl font-bold text-gray-900">Test Executions</h1>
          <p className="text-gray-600 mt-1">
            {hasRole('tester') ? 'Execute your assigned tests and submit results' : 
             hasRole('qa_manager') ? 'Review and approve test executions' :
             'View test execution progress and results'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'submitted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('submitted')}
        >
          Submitted
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
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Executions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {executions.map((execution) => (
          <Card key={execution.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {execution.assignment?.template?.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                        {execution.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewExecution(execution)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canContinueExecution(execution) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedExecution(execution);
                        setViewMode('execute');
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Product Details</h4>
                  <p className="text-sm text-gray-600">{execution.assignment?.productName}</p>
                  <p className="text-sm text-gray-600">Batch: {execution.assignment?.batchNumber}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Tester</h4>
                  <p className="text-sm text-gray-600">
                    {execution.tester?.firstName} {execution.tester?.lastName}
                  </p>
                </div>
                
                {execution.overallResult && (
                  <div>
                    <h4 className="font-medium text-gray-900">Result</h4>
                    <div className="flex items-center space-x-2">
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
                )}
                
                {execution.qaManagerId && (
                  <div>
                    <h4 className="font-medium text-gray-900">QA Manager</h4>
                    <p className="text-sm text-gray-600">
                      {execution.qaManager?.firstName} {execution.qaManager?.lastName}
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Started: {new Date(execution.startedAt).toLocaleDateString()}
                  {execution.submittedAt && (
                    <span className="block">
                      Submitted: {new Date(execution.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {executions.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FileText className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'all' ? 'No test executions' : `No ${filter.replace('_', ' ')} executions`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasRole('tester') ? 'Start executing your assigned tests from the Assignments page.' : 
             'Test executions will appear here once testers start their assigned tests.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Executions;
