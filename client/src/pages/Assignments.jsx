import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { assignmentsAPI, executionsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { Plus, Eye, Play, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AssignmentForm from '../components/assignments/AssignmentForm';
import AssignmentView from '../components/assignments/AssignmentView';

const Assignments = () => {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Removed unused showForm state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'view'
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await assignmentsAPI.getAssignments(params);
      setAssignments(response.data.assignments);
    } catch (err) {
      setError('Failed to load assignments');
      console.error('Assignments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setViewMode('form');
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setViewMode('view');
  };

  const handleStartTest = async (assignmentId) => {
    try {
      await executionsAPI.startExecution(assignmentId);
      // Navigate to executions page after starting execution
      navigate('/executions');
    } catch (err) {
      setError('Failed to start test execution');
      console.error('Start test error:', err);
    }
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    fetchAssignments();
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedAssignment(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-600" />;
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
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
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

  const canStartTest = (assignment) => {
    if (!hasRole('tester') || (assignment.status !== 'assigned' && assignment.status !== 'in_progress')) {
      return false;
    }
    
    // Check if user is assigned to this test (either old way or new way)
    const isAssignedOldWay = assignment.assignedTesterId === user?.id;
    const isAssignedNewWay = assignment.testers && assignment.testers.some(tester => tester.id === user?.id);
    
    return isAssignedOldWay || isAssignedNewWay;
  };

  if (viewMode === 'form') {
    return (
      <AssignmentForm
        assignment={selectedAssignment}
        onSuccess={handleFormSuccess}
        onCancel={handleBack}
      />
    );
  }

  if (viewMode === 'view') {
    return (
      <AssignmentView
        assignment={selectedAssignment}
        onBack={handleBack}
        onStartTest={canStartTest(selectedAssignment) ? () => handleStartTest(selectedAssignment.id) : null}
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
          <h1 className="text-3xl font-bold text-gray-900">Test Assignments</h1>
          <p className="text-gray-600 mt-1">
            {hasRole('admin') ? 'Manage test assignments for all testers' : 
             hasRole('tester') ? 'Your assigned tests' :
             'View test assignments and progress'}
          </p>
        </div>
        {hasRole('admin') && (
          <Button onClick={handleCreateAssignment}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        )}
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
          variant={filter === 'assigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('assigned')}
        >
          Assigned
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

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assignment.template?.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(assignment.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewAssignment(assignment)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canStartTest(assignment) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartTest(assignment.id)}
                      className="text-green-600 hover:text-green-700"
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
                  <p className="text-sm text-gray-600">{assignment.productName}</p>
                  <p className="text-sm text-gray-600">Batch: {assignment.batchNumber}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Assignment Info</h4>
                  {assignment.testers && assignment.testers.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        Assigned to: {assignment.testers.length > 1 ? `${assignment.testers.length} testers` : `${assignment.testers[0].firstName} ${assignment.testers[0].lastName}`}
                      </p>
                      {assignment.testers.length > 1 && (
                        <p className="text-xs text-gray-500">
                          {assignment.testers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Assigned to: {assignment.tester?.firstName} {assignment.tester?.lastName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    By: {assignment.assignedBy?.firstName} {assignment.assignedBy?.lastName}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Template</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {assignment.template?.category?.replace('_', ' ')}
                  </p>
                </div>
                
                {assignment.dueDate && (
                  <div>
                    <h4 className="font-medium text-gray-900">Due Date</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Assigned: {new Date(assignment.assignedAt || assignment.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {assignments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'all' ? 'No assignments' : `No ${filter.replace('_', ' ')} assignments`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasRole('admin') ? 'Get started by creating a new test assignment.' : 
             hasRole('tester') ? 'No tests have been assigned to you yet.' :
             'No assignments match the current filter.'}
          </p>
          {hasRole('admin') && filter === 'all' && (
            <div className="mt-6">
              <Button onClick={handleCreateAssignment}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
