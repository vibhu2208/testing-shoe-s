import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { assignmentsAPI, templatesAPI, usersAPI } from '../../lib/api';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

const AssignmentForm = ({ assignment, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    templateId: '',
    assignedTesterId: '', // Keep for backward compatibility
    assignedTesterIds: [], // New field for multiple testers
    batchNumber: '',
    productName: '',
    dueDate: '',
    notes: ''
  });
  const [templates, setTemplates] = useState([]);
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (assignment) {
      // Extract tester IDs from both single tester and multiple testers
      const testerIds = assignment.testers && assignment.testers.length > 0 
        ? assignment.testers.map(tester => tester.id)
        : assignment.assignedTesterId ? [assignment.assignedTesterId] : [];

      setFormData({
        templateId: assignment.templateId || '',
        assignedTesterId: assignment.assignedTesterId || '',
        assignedTesterIds: testerIds,
        batchNumber: assignment.batchNumber || '',
        productName: assignment.productName || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
        notes: assignment.notes || ''
      });
    }
  }, [assignment]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      
      // Load templates and testers in parallel
      const [templatesResponse, usersResponse] = await Promise.all([
        templatesAPI.getTemplates({ isActive: true }),
        usersAPI.getUsers({ role: 'tester', isActive: true })
      ]);

      setTemplates(templatesResponse.data.templates);
      setTesters(usersResponse.data.users);
    } catch (err) {
      setError('Failed to load form data');
      console.error('Load form data error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTesterSelection = (testerId) => {
    setFormData(prev => {
      const currentIds = prev.assignedTesterIds || [];
      const isSelected = currentIds.includes(testerId);
      
      if (isSelected) {
        // Remove tester
        return {
          ...prev,
          assignedTesterIds: currentIds.filter(id => id !== testerId)
        };
      } else {
        // Add tester
        return {
          ...prev,
          assignedTesterIds: [...currentIds, testerId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.templateId) {
      setError('Please select a template');
      return;
    }

    if (!formData.assignedTesterIds || formData.assignedTesterIds.length === 0) {
      setError('Please select at least one tester');
      return;
    }

    if (!formData.batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }

    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }

    const submitData = {
      ...formData,
      // Send the multiple testers array
      assignedTesterIds: formData.assignedTesterIds
    };

    // Only include dueDate if it has a value
    if (formData.dueDate) {
      submitData.dueDate = formData.dueDate;
    } else {
      delete submitData.dueDate;
    }

    try {
      setLoading(true);

      if (assignment) {
        // Update assignment (if editing is allowed)
        await assignmentsAPI.updateAssignment(assignment.id, submitData);
      } else {
        // Create new assignment
        await assignmentsAPI.createAssignment(submitData);
      }

      onSuccess();
    } catch (err) {
      console.error('Assignment save error details:', {
        error: err,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status,
        submitData: submitData
      });
      setError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {assignment ? 'Edit Assignment' : 'Create Assignment'}
          </h1>
          <p className="text-gray-600 mt-1">
            Assign a test template to a specific tester
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Select the template and testers for this assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateId">Test Template</Label>
                <select
                  id="templateId"
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Assign to Testers</Label>
                <div className="border border-input rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-sm text-gray-600 mb-2">
                    Select one or more testers ({formData.assignedTesterIds?.length || 0} selected)
                  </div>
                  {testers.map((tester) => {
                    const isSelected = formData.assignedTesterIds?.includes(tester.id);
                    return (
                      <div key={tester.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tester-${tester.id}`}
                          checked={isSelected}
                          onChange={() => handleTesterSelection(tester.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`tester-${tester.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {tester.firstName} {tester.lastName} ({tester.email})
                        </label>
                      </div>
                    );
                  })}
                  {testers.length === 0 && (
                    <p className="text-sm text-gray-500">No testers available</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Details about the product being tested
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="Enter batch number"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or instructions for the tester"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Preview */}
        {formData.templateId && (
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview of the selected template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const selectedTemplate = templates.find(t => t.id === formData.templateId);
                if (!selectedTemplate) return null;

                return (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Template: {selectedTemplate.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        Category: {selectedTemplate.category.replace('_', ' ')}
                      </p>
                      {selectedTemplate.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">Parameters ({selectedTemplate.parameters?.length || 0})</h4>
                      {selectedTemplate.parameters && selectedTemplate.parameters.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {selectedTemplate.parameters
                            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                            .slice(0, 5) // Show first 5 parameters
                            .map((param, index) => (
                            <div key={param.id} className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-500">#{param.sequenceOrder}</span>
                              <span className="font-medium">{param.name}</span>
                              <span className="text-gray-500">({param.type})</span>
                              {param.isMandatory && (
                                <span className="px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">Required</span>
                              )}
                            </div>
                          ))}
                          {selectedTemplate.parameters.length > 5 && (
                            <p className="text-sm text-gray-500">
                              ... and {selectedTemplate.parameters.length - 5} more parameters
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No parameters defined</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {assignment ? 'Update Assignment' : 'Create Assignment'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentForm;
