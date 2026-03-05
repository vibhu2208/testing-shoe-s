import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { executionsAPI } from '../../lib/api';
import { ArrowLeft, Save, Send, AlertTriangle } from 'lucide-react';

const TestExecutionForm = ({ execution, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [overallResult, setOverallResult] = useState(null);

  useEffect(() => {
    if (execution && execution.assignment?.template?.parameters) {
      const initialData = {};
      execution.assignment.template.parameters.forEach(param => {
        const existingResult = execution.results?.find(r => r.parameterId === param.id);
        initialData[param.id] = existingResult?.observedValue || '';
      });
      setFormData(initialData);
      
      // Calculate initial overall result
      calculateOverallResult(initialData);
    } else {
      setFormData({});
      setOverallResult(null);
    }
  }, [execution]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (parameterId, value) => {
    const newFormData = {
      ...formData,
      [parameterId]: value
    };
    setFormData(newFormData);
    
    // Clear validation error for this field
    if (validationErrors[parameterId]) {
      setValidationErrors(prev => ({
        ...prev,
        [parameterId]: null
      }));
    }
    
    // Recalculate overall result
    calculateOverallResult(newFormData);
  };

  const validateParameter = (parameter, value) => {
    if (parameter.isMandatory && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    if (!value || value.toString().trim() === '') {
      return null; // Optional field, no validation needed
    }

    switch (parameter.type) {
      case 'numeric':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return 'Must be a valid number';
        }
        if (parameter.minValue !== null && numValue < parameter.minValue) {
          return `Must be at least ${parameter.minValue}`;
        }
        if (parameter.maxValue !== null && numValue > parameter.maxValue) {
          return `Must be at most ${parameter.maxValue}`;
        }
        break;
        
      case 'text':
        if (parameter.maxLength && value.length > parameter.maxLength) {
          return `Must be at most ${parameter.maxLength} characters`;
        }
        break;
        
      case 'dropdown':
        if (!parameter.dropdownOptions?.includes(value)) {
          return 'Please select a valid option';
        }
        break;
      default:
        break;
    }
    
    return null;
  };

  const calculateParameterResult = (parameter, value) => {
    if (!value || value.toString().trim() === '') {
      return parameter.isMandatory ? 'FAIL' : 'PASS';
    }

    switch (parameter.type) {
      case 'numeric':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return 'FAIL';
        
        if (parameter.minValue !== null && numValue < parameter.minValue) return 'FAIL';
        if (parameter.maxValue !== null && numValue > parameter.maxValue) return 'FAIL';
        return 'PASS';
        
      case 'text':
        if (parameter.maxLength && value.length > parameter.maxLength) return 'FAIL';
        return 'PASS';
        
      case 'dropdown':
        if (!parameter.dropdownOptions?.includes(value)) return 'FAIL';
        
        // Check if value is in acceptable values (if defined)
        if (parameter.acceptableValues && parameter.acceptableValues.length > 0) {
          return parameter.acceptableValues.includes(value) ? 'PASS' : 'FAIL';
        }
        return 'PASS';
        
      case 'boolean':
        return value === true || value === 'true' || value === 'yes' ? 'PASS' : 'FAIL';
        
      default:
        return 'PASS';
    }
  };

  const calculateOverallResult = (currentFormData) => {
    if (!execution?.assignment?.template?.parameters) return;

    const parameters = execution.assignment.template.parameters;
    let hasFailures = false;
    let hasIncomplete = false;

    parameters.forEach(param => {
      const value = currentFormData[param.id];
      
      if (param.isMandatory && (!value || value.toString().trim() === '')) {
        hasIncomplete = true;
        return;
      }

      if (value && value.toString().trim() !== '') {
        const result = calculateParameterResult(param, value);
        if (result === 'FAIL') {
          hasFailures = true;
        }
      }
    });

    if (hasIncomplete) {
      setOverallResult(null);
    } else if (hasFailures) {
      setOverallResult('FAIL');
    } else {
      setOverallResult('PASS');
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    execution.assignment.template.parameters.forEach(param => {
      const value = formData[param.id];
      const error = validateParameter(param, value);
      if (error) {
        errors[param.id] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const results = execution.assignment.template.parameters.map(param => ({
        parameterId: param.id,
        observedValue: formData[param.id] || '',
        result: calculateParameterResult(param, formData[param.id])
      }));

      await executionsAPI.submitResults(execution.id, {
        results,
        overallResult,
        save: true // Save but don't submit
      });

      setError('');
      alert('Progress saved successfully!');
      // Don't redirect, allow continued editing
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save results');
      console.error('Save results error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    if (overallResult === null) {
      setError('Please complete all mandatory fields before submitting');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const results = execution.assignment.template.parameters.map(param => ({
        parameterId: param.id,
        observedValue: formData[param.id] || '',
        result: calculateParameterResult(param, formData[param.id])
      }));

      await executionsAPI.submitResults(execution.id, {
        results,
        overallResult,
        submit: true // Final submission
      });

      alert('Test submitted successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit results');
      console.error('Submit results error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!execution || !execution.assignment?.template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Test execution not found</p>
        <Button onClick={onCancel} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Executions
        </Button>
      </div>
    );
  }

  const template = execution.assignment.template;
  const parameters = template.parameters?.sort((a, b) => a.sequenceOrder - b.sequenceOrder) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Execute Test</h1>
          <p className="text-gray-600 mt-1">
            {template.name} - {execution.assignment.productName}
          </p>
        </div>
      </div>

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
          <CardDescription>
            Details about this test execution
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Product</h4>
            <p className="text-gray-600">{execution.assignment.productName}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Batch Number</h4>
            <p className="text-gray-600">{execution.assignment.batchNumber}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Template</h4>
            <p className="text-gray-600 capitalize">{template.category.replace('_', ' ')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overall Result Preview */}
      {overallResult && (
        <Card className={`border-2 ${overallResult === 'PASS' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${overallResult === 'PASS' ? 'bg-green-600' : 'bg-red-600'}`}></div>
              <span className="font-medium">
                Overall Result: <span className={overallResult === 'PASS' ? 'text-green-800' : 'text-red-800'}>{overallResult}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {/* Test Parameters Form */}
      <Card>
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
          <CardDescription>
            Enter the observed values for each parameter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {parameters.map((parameter, index) => {
              const value = formData[parameter.id] || '';
              const error = validationErrors[parameter.id];
              const result = value ? calculateParameterResult(parameter, value) : null;

              return (
                <div key={parameter.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Label className="text-base font-medium">
                        {parameter.sequenceOrder}. {parameter.name}
                        {parameter.isMandatory && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: {parameter.type}
                        {parameter.type === 'numeric' && (parameter.minValue !== null || parameter.maxValue !== null) && (
                          <span className="ml-2">
                            Range: {parameter.minValue ?? '∞'} - {parameter.maxValue ?? '∞'}
                          </span>
                        )}
                        {parameter.type === 'text' && parameter.maxLength && (
                          <span className="ml-2">Max length: {parameter.maxLength}</span>
                        )}
                      </p>
                    </div>
                    {result && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {parameter.type === 'dropdown' ? (
                      <select
                        value={value}
                        onChange={(e) => handleInputChange(parameter.id, e.target.value)}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          error ? 'border-red-500' : 'border-input'
                        }`}
                      >
                        <option value="">Select an option</option>
                        {parameter.dropdownOptions?.map((option, optIndex) => (
                          <option key={optIndex} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : parameter.type === 'boolean' ? (
                      <select
                        value={value}
                        onChange={(e) => handleInputChange(parameter.id, e.target.value)}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          error ? 'border-red-500' : 'border-input'
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="true">Yes / Pass</option>
                        <option value="false">No / Fail</option>
                      </select>
                    ) : (
                      <Input
                        type={parameter.type === 'numeric' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleInputChange(parameter.id, e.target.value)}
                        placeholder={`Enter ${parameter.name.toLowerCase()}`}
                        className={error ? 'border-red-500' : ''}
                        step={parameter.type === 'numeric' ? 'any' : undefined}
                        min={parameter.type === 'numeric' && parameter.minValue !== null ? parameter.minValue : undefined}
                        max={parameter.type === 'numeric' && parameter.maxValue !== null ? parameter.maxValue : undefined}
                        maxLength={parameter.type === 'text' && parameter.maxLength ? parameter.maxLength : undefined}
                      />
                    )}

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    {parameter.type === 'dropdown' && parameter.acceptableValues && parameter.acceptableValues.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Pass values:</span>{' '}
                        {parameter.acceptableValues.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="outline" onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Progress
            </>
          )}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={loading || overallResult === null}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Test
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TestExecutionForm;
