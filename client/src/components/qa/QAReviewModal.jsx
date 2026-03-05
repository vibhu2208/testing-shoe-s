import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { executionsAPI } from '../../lib/api';
import { CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';

const QAReviewModal = ({ execution, onSuccess, onCancel }) => {
  const [decision, setDecision] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      setError('Please select approve or reject');
      return;
    }

    if (decision === 'reject' && !comments.trim()) {
      setError('Comments are required when rejecting a test');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await executionsAPI.reviewExecution(execution.id, {
        action: decision,
        qaComments: comments.trim() || null
      });

      onSuccess();
    } catch (err) {
      console.error('QA Review error details:', {
        error: err,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status,
        executionId: execution.id,
        requestData: { action: decision, qaComments: comments.trim() || null }
      });
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
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

  const template = execution.assignment?.template;
  const results = execution.results || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">QA Review</h2>
            <p className="text-gray-600 mt-1">{template?.name} - {execution.assignment?.productName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                  <p className="text-gray-500">{execution.tester?.email}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Overall Result:</span>
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
              </div>
            </CardContent>
          </Card>

          {/* Test Results Review */}
          <Card>
            <CardHeader>
              <CardTitle>Parameter Results</CardTitle>
              <CardDescription>
                Review each parameter result for accuracy and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Type:</span>
                                <span className="ml-2 text-gray-600">{parameter.type}</span>
                                
                                {parameter.type === 'numeric' && (parameter.minValue !== null || parameter.maxValue !== null) && (
                                  <div className="mt-1">
                                    <span className="font-medium text-gray-700">Expected Range:</span>
                                    <span className="ml-2 text-gray-600">
                                      {parameter.minValue ?? '∞'} - {parameter.maxValue ?? '∞'}
                                    </span>
                                  </div>
                                )}
                                
                                {parameter.type === 'dropdown' && parameter.acceptableValues && parameter.acceptableValues.length > 0 && (
                                  <div className="mt-1">
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
                              
                              <div>
                                <span className="font-medium text-gray-700">Observed Value:</span>
                                <div className="mt-1">
                                  <span className={`px-3 py-1 rounded-md font-medium ${
                                    result?.result === 'PASS' 
                                      ? 'bg-green-50 text-green-800 border border-green-200' 
                                      : result?.result === 'FAIL'
                                      ? 'bg-red-50 text-red-800 border border-red-200'
                                      : 'bg-gray-50 text-gray-800 border border-gray-200'
                                  }`}>
                                    {result?.observedValue || 'No value entered'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* QA Decision */}
          <Card>
            <CardHeader>
              <CardTitle>QA Decision</CardTitle>
              <CardDescription>
                Review the test results and provide your decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Decision Selection */}
                <div>
                  <Label className="text-base font-medium">Decision</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="approve"
                        name="decision"
                        value="approve"
                        checked={decision === 'approve'}
                        onChange={(e) => setDecision(e.target.value)}
                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <label htmlFor="approve" className="flex items-center space-x-2 cursor-pointer">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Approve Test</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="reject"
                        name="decision"
                        value="reject"
                        checked={decision === 'reject'}
                        onChange={(e) => setDecision(e.target.value)}
                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <label htmlFor="reject" className="flex items-center space-x-2 cursor-pointer">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-800 font-medium">Reject Test</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <Label htmlFor="comments" className="text-base font-medium">
                    Comments {decision === 'reject' && <span className="text-red-500">*</span>}
                  </Label>
                  <textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      decision === 'approve' 
                        ? "Optional: Add any additional comments or observations..."
                        : decision === 'reject'
                        ? "Required: Explain why this test is being rejected and what needs to be corrected..."
                        : "Add comments about your review..."
                    }
                    className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={4}
                    required={decision === 'reject'}
                  />
                  {decision === 'reject' && (
                    <p className="mt-1 text-sm text-red-600">
                      Comments are required when rejecting a test to help the tester understand what needs to be corrected.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !decision}
                    className={decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        {decision === 'approve' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Test
                          </>
                        ) : decision === 'reject' ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Test
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Submit Review
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QAReviewModal;
