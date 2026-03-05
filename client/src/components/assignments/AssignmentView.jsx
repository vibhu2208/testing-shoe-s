import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Play, Eye, Clock, CheckCircle, XCircle, AlertCircle, Calendar, User, Package } from 'lucide-react';

const AssignmentView = ({ assignment, onBack, onStartTest }) => {
  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Assignment not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-yellow-600" />;
      case 'submitted':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {assignment.template?.name}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(assignment.status)}
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                {assignment.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        {onStartTest && (
          <Button onClick={onStartTest} className="bg-green-600 hover:bg-green-700">
            <Play className="mr-2 h-4 w-4" />
            Start Test
          </Button>
        )}
      </div>

      {/* Assignment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Product Name</h4>
              <p className="text-gray-600">{assignment.productName}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Batch Number</h4>
              <p className="text-gray-600">{assignment.batchNumber}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Status</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon(assignment.status)}
                <span className="text-gray-600 capitalize">
                  {assignment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Assigned Date</h4>
              <p className="text-gray-600">
                {formatDate(assignment.assignedAt || assignment.createdAt)}
              </p>
            </div>
            
            {assignment.dueDate && (
              <div>
                <h4 className="font-medium text-gray-900">Due Date</h4>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-600">{formatDate(assignment.dueDate)}</p>
                </div>
              </div>
            )}
            
            {assignment.notes && (
              <div>
                <h4 className="font-medium text-gray-900">Notes</h4>
                <p className="text-gray-600 text-sm">{assignment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* People Involved */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              People Involved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Assigned To</h4>
              {assignment.testers && assignment.testers.length > 0 ? (
                <div className="space-y-2">
                  {assignment.testers.map((tester, index) => (
                    <div key={tester.id}>
                      <p className="text-gray-600">
                        {tester.firstName} {tester.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{tester.email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    {assignment.tester?.firstName} {assignment.tester?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{assignment.tester?.email}</p>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Assigned By</h4>
              <p className="text-gray-600">
                {assignment.assignedBy?.firstName} {assignment.assignedBy?.lastName}
              </p>
              <p className="text-sm text-gray-500">{assignment.assignedBy?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Template Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Template Name</h4>
              <p className="text-gray-600">{assignment.template?.name}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Category</h4>
              <p className="text-gray-600 capitalize">
                {assignment.template?.category?.replace('_', ' ')}
              </p>
            </div>
            
            {assignment.template?.description && (
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-gray-600 text-sm">{assignment.template.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Parameters</h4>
              <p className="text-gray-600">
                {assignment.template?.parameters?.length || 0} parameters to test
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Parameters Preview */}
      {assignment.template?.parameters && assignment.template.parameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>
              Parameters that will be tested in this assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignment.template.parameters
                .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                .map((parameter) => (
                <div
                  key={parameter.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{parameter.name}</h4>
                      <p className="text-sm text-gray-500">#{parameter.sequenceOrder}</p>
                    </div>
                    {parameter.isMandatory && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {parameter.type}
                    </p>
                    
                    {parameter.type === 'numeric' && (parameter.minValue !== null || parameter.maxValue !== null) && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Range:</span>{' '}
                        {parameter.minValue !== null ? parameter.minValue : '∞'} - {parameter.maxValue !== null ? parameter.maxValue : '∞'}
                      </p>
                    )}
                    
                    {parameter.type === 'text' && parameter.maxLength && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Max Length:</span> {parameter.maxLength}
                      </p>
                    )}
                    
                    {parameter.type === 'dropdown' && parameter.dropdownOptions && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Options:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parameter.dropdownOptions.slice(0, 3).map((option, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                            >
                              {option}
                            </span>
                          ))}
                          {parameter.dropdownOptions.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{parameter.dropdownOptions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            What happens next
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {assignment.status === 'assigned' && onStartTest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Ready to Start</h4>
                <p className="text-blue-800 mb-3">
                  This test is ready to begin. Click the "Start Test" button to begin the test execution process.
                </p>
                <Button onClick={onStartTest} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="mr-2 h-4 w-4" />
                  Start Test Now
                </Button>
              </div>
            )}
            
            {assignment.status === 'assigned' && !onStartTest && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Waiting for Tester</h4>
                <p className="text-gray-700">
                  This assignment is waiting for the assigned tester to start the test execution.
                </p>
              </div>
            )}
            
            {assignment.status === 'in_progress' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Test in Progress</h4>
                <p className="text-yellow-800">
                  The test execution has started and is currently in progress.
                </p>
              </div>
            )}
            
            {assignment.status === 'submitted' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Awaiting QA Review</h4>
                <p className="text-orange-800">
                  The test has been completed and submitted. It is now waiting for QA Manager review and approval.
                </p>
              </div>
            )}
            
            {assignment.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Test Approved</h4>
                <p className="text-green-800">
                  This test has been reviewed and approved by the QA Manager. A report can now be generated.
                </p>
              </div>
            )}
            
            {assignment.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Test Rejected</h4>
                <p className="text-red-800">
                  This test has been reviewed and rejected by the QA Manager. The tester may need to repeat the test.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentView;
