import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { executionsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { Play, Eye, CheckCircle, XCircle, Clock, AlertCircle, FileText, TestTube } from 'lucide-react';
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

  const fetchExecutions = useCallback(async () => {
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
  }, [filter]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <TestTube className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Test Executions</h1>
            </div>
            <p className="text-gray-600 text-lg">
              {hasRole('tester') ? 'Execute your assigned tests and submit results' : 
               hasRole('qa_manager') ? 'Review and approve test executions' :
               'View test execution progress and results'}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex items-center space-x-2"
          >
            <span>All</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {executions.length}
            </span>
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in_progress')}
            className="flex items-center space-x-2"
          >
            <Play className="h-3 w-3" />
            <span>In Progress</span>
          </Button>
          <Button
            variant={filter === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('submitted')}
            className="flex items-center space-x-2"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Submitted</span>
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('approved')}
            className="flex items-center space-x-2"
          >
            <CheckCircle className="h-3 w-3" />
            <span>Approved</span>
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('rejected')}
            className="flex items-center space-x-2"
          >
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Error Message */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Executions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {executions.map((execution) => (
          <Card key={execution.id} className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {execution.assignment?.template?.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)} shadow-sm`}>
                        {execution.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewExecution(execution)}
                    className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
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
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-3">
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    Product Details
                  </h4>
                  <p className="text-sm text-gray-700 font-medium">{execution.assignment?.productName}</p>
                  <p className="text-xs text-gray-500">Batch: {execution.assignment?.batchNumber}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Tester</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {execution.tester?.firstName?.[0]}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {execution.tester?.firstName} {execution.tester?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  {execution.overallResult && (
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Result</h4>
                      <div className="flex items-center space-x-2">
                        {getOverallResultIcon(execution.overallResult)}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          execution.overallResult === 'PASS' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {execution.overallResult}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {execution.qaManagerId && (
                  <div className="bg-amber-50/50 rounded-xl p-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center">
                      <CheckCircle className="h-3 w-3 text-amber-600 mr-2" />
                      QA Manager
                    </h4>
                    <p className="text-sm text-gray-700 font-medium">
                      {execution.qaManager?.firstName} {execution.qaManager?.lastName}
                    </p>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-3 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Started: {new Date(execution.startedAt).toLocaleDateString()}</span>
                    </div>
                    {execution.submittedAt && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Submitted: {new Date(execution.submittedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {executions.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No test executions found' : `No ${filter.replace('_', ' ')} executions`}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {hasRole('tester') ? 'Start executing your assigned tests from the Assignments page to see them here.' : 
             'Test executions will appear here once testers start their assigned tests.'}
          </p>
          {hasRole('tester') && (
            <Button 
              onClick={() => window.location.href = '/assignments'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              View Assignments
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Executions;
