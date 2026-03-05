import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, AlertCircle, User, Package, FileText } from 'lucide-react';

const ExecutionView = ({ execution, onBack, onContinue }) => {
  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Execution not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Executions
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-600" />;
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

  const getResultIcon = (result) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const template = execution.assignment?.template;
  const results = execution.results || [];

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
              {template?.name}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(execution.status)}
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(execution.status)}`}>
                {execution.status.replace('_', ' ')}
              </span>
              {execution.overallResult && (
                <>
                  {getResultIcon(execution.overallResult)}
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                    execution.overallResult === 'PASS' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {execution.overallResult}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {onContinue && (
          <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
            <Play className="mr-2 h-4 w-4" />
            Continue Test
          </Button>
        )}
      </div>

      {/* Execution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Execution Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Status</h4>
              <div className="flex items-center space-x-2">
                {getStatusIcon(execution.status)}
                <span className="text-gray-600 capitalize">
                  {execution.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {execution.overallResult && (
              <div>
                <h4 className="font-medium text-gray-900">Overall Result</h4>
                <div className="flex items-center space-x-2">
                  {getResultIcon(execution.overallResult)}
                  <span className="text-gray-600">{execution.overallResult}</span>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Started</h4>
              <p className="text-gray-600">{formatDate(execution.startedAt)}</p>
            </div>
            
            {execution.submittedAt && (
              <div>
                <h4 className="font-medium text-gray-900">Submitted</h4>
                <p className="text-gray-600">{formatDate(execution.submittedAt)}</p>
              </div>
            )}
            
            {execution.approvedAt && (
              <div>
                <h4 className="font-medium text-gray-900">Approved</h4>
                <p className="text-gray-600">{formatDate(execution.approvedAt)}</p>
              </div>
            )}
            
            {execution.rejectedAt && (
              <div>
                <h4 className="font-medium text-gray-900">Rejected</h4>
                <p className="text-gray-600">{formatDate(execution.rejectedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Product Name</h4>
              <p className="text-gray-600">{execution.assignment?.productName}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Batch Number</h4>
              <p className="text-gray-600">{execution.assignment?.batchNumber}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Template</h4>
              <p className="text-gray-600 capitalize">
                {template?.category?.replace('_', ' ')}
              </p>
            </div>
            
            {template?.description && (
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-gray-600 text-sm">{template.description}</p>
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
              <h4 className="font-medium text-gray-900">Tester</h4>
              <p className="text-gray-600">
                {execution.tester?.firstName} {execution.tester?.lastName}
              </p>
              <p className="text-sm text-gray-500">{execution.tester?.email}</p>
            </div>
            
            {execution.qaManager && (
              <div>
                <h4 className="font-medium text-gray-900">QA Manager</h4>
                <p className="text-gray-600">
                  {execution.qaManager.firstName} {execution.qaManager.lastName}
                </p>
                <p className="text-sm text-gray-500">{execution.qaManager.email}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Assigned By</h4>
              <p className="text-gray-600">
                {execution.assignment?.assignedBy?.firstName} {execution.assignment?.assignedBy?.lastName}
              </p>
              <p className="text-sm text-gray-500">{execution.assignment?.assignedBy?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Parameter values and results from the test execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {template?.parameters
                ?.sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                .map((parameter) => {
                  const result = results.find(r => r.parameterId === parameter.id);
                  return (
                    <div
                      key={parameter.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {parameter.sequenceOrder}. {parameter.name}
                            </h4>
                            {parameter.isMandatory && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                            {result && (
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                result.result === 'PASS' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.result}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Type:</span>
                                <span className="ml-2 text-gray-600">{parameter.type}</span>
                              </div>
                              
                              {parameter.type === 'numeric' && (parameter.minValue !== null || parameter.maxValue !== null) && (
                                <div>
                                  <span className="font-medium text-gray-700">Range:</span>
                                  <span className="ml-2 text-gray-600">
                                    {parameter.minValue ?? '∞'} - {parameter.maxValue ?? '∞'}
                                  </span>
                                </div>
                              )}
                              
                              {parameter.type === 'text' && parameter.maxLength && (
                                <div>
                                  <span className="font-medium text-gray-700">Max Length:</span>
                                  <span className="ml-2 text-gray-600">{parameter.maxLength}</span>
                                </div>
                              )}
                            </div>
                            
                            {result && (
                              <div>
                                <span className="font-medium text-gray-700">Observed Value:</span>
                                <span className="ml-2 text-gray-900 font-medium">
                                  {result.observedValue || 'No value entered'}
                                </span>
                              </div>
                            )}
                            
                            {parameter.type === 'dropdown' && parameter.dropdownOptions && (
                              <div>
                                <span className="font-medium text-gray-700">Available Options:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parameter.dropdownOptions.map((option, index) => (
                                    <span
                                      key={index}
                                      className={`inline-flex px-2 py-1 text-xs rounded ${
                                        result?.observedValue === option
                                          ? 'bg-blue-200 text-blue-800 font-medium'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                                
                                {parameter.acceptableValues && parameter.acceptableValues.length > 0 && (
                                  <div className="mt-2">
                                    <span className="font-medium text-gray-700">Pass Values:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {parameter.acceptableValues.map((value, index) => (
                                        <span
                                          key={index}
                                          className="inline-flex px-2 py-1 text-xs rounded bg-green-100 text-green-800"
                                        >
                                          {value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No test results available yet</p>
              {execution.status === 'in_progress' && (
                <p className="text-sm mt-1">Test is still in progress</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QA Comments */}
      {(execution.qaComments || execution.status === 'rejected') && (
        <Card>
          <CardHeader>
            <CardTitle>QA Manager Comments</CardTitle>
            <CardDescription>
              Feedback from the QA Manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            {execution.qaComments ? (
              <div className={`p-4 rounded-lg ${
                execution.status === 'approved' 
                  ? 'bg-green-50 border border-green-200' 
                  : execution.status === 'rejected'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="text-gray-800">{execution.qaComments}</p>
                {execution.approvedAt && (
                  <p className="text-sm text-green-600 mt-2">
                    Approved on {formatDate(execution.approvedAt)}
                  </p>
                )}
                {execution.rejectedAt && (
                  <p className="text-sm text-red-600 mt-2">
                    Rejected on {formatDate(execution.rejectedAt)}
                  </p>
                )}
              </div>
            ) : execution.status === 'rejected' ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800">This test was rejected but no specific comments were provided.</p>
                <p className="text-sm text-red-600 mt-2">
                  Rejected on {formatDate(execution.rejectedAt)}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No comments available</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Status Information</CardTitle>
          <CardDescription>
            Current status and next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {execution.status === 'in_progress' && onContinue && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Test in Progress</h4>
                <p className="text-blue-800 mb-3">
                  This test execution is currently in progress. You can continue entering parameter values and submit when ready.
                </p>
                <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="mr-2 h-4 w-4" />
                  Continue Test
                </Button>
              </div>
            )}
            
            {execution.status === 'in_progress' && !onContinue && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Test in Progress</h4>
                <p className="text-gray-700">
                  This test execution is currently in progress by the assigned tester.
                </p>
              </div>
            )}
            
            {execution.status === 'submitted' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Awaiting QA Review</h4>
                <p className="text-orange-800">
                  The test has been completed and submitted. It is now waiting for QA Manager review and approval.
                </p>
              </div>
            )}
            
            {execution.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Test Approved</h4>
                <p className="text-green-800">
                  This test has been reviewed and approved by the QA Manager. A report can now be generated.
                </p>
              </div>
            )}
            
            {execution.status === 'rejected' && (
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

export default ExecutionView;
