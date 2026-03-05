import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { templatesAPI } from '../../lib/api';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

const TemplateForm = ({ template, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'raw',
    description: '',
    parameters: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        category: template.category || 'raw',
        description: template.description || '',
        parameters: template.parameters || []
      });
    }
  }, [template]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addParameter = () => {
    const newParameter = {
      id: Date.now(), // Temporary ID for new parameters
      name: '',
      type: 'text',
      isMandatory: true,
      sequenceOrder: formData.parameters.length + 1,
      minValue: null,
      maxValue: null,
      dropdownOptions: [],
      acceptableValues: [],
      maxLength: null,
      validationPattern: ''
    };

    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, newParameter]
    }));
  };

  const removeParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const updateParameter = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (formData.parameters.length === 0) {
      setError('At least one parameter is required');
      return;
    }

    // Validate parameters
    for (let i = 0; i < formData.parameters.length; i++) {
      const param = formData.parameters[i];
      if (!param.name.trim()) {
        setError(`Parameter ${i + 1} name is required`);
        return;
      }

      if (param.type === 'numeric') {
        if (param.minValue !== null && param.maxValue !== null) {
          if (parseFloat(param.minValue) >= parseFloat(param.maxValue)) {
            setError(`Parameter "${param.name}": Min value must be less than max value`);
            return;
          }
        }
      }

      if (param.type === 'dropdown') {
        if (!param.dropdownOptions || param.dropdownOptions.length === 0) {
          setError(`Parameter "${param.name}": Dropdown options are required`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        parameters: formData.parameters.map((param, index) => ({
          ...param,
          sequenceOrder: index + 1
        }))
      };

      if (template) {
        await templatesAPI.updateTemplate(template.id, submitData);
      } else {
        await templatesAPI.createTemplate(submitData);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
      console.error('Template save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ParameterForm = ({ parameter, index }) => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Parameter {index + 1}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeParameter(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`param-name-${index}`}>Parameter Name</Label>
              <Input
                id={`param-name-${index}`}
                value={parameter.name}
                onChange={(e) => updateParameter(index, 'name', e.target.value)}
                placeholder="Enter parameter name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor={`param-type-${index}`}>Type</Label>
              <select
                id={`param-type-${index}`}
                value={parameter.type}
                onChange={(e) => updateParameter(index, 'type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="text">Text</option>
                <option value="numeric">Numeric</option>
                <option value="dropdown">Dropdown</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`param-mandatory-${index}`}
              checked={parameter.isMandatory}
              onChange={(e) => updateParameter(index, 'isMandatory', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor={`param-mandatory-${index}`}>Mandatory</Label>
          </div>

          {/* Type-specific fields */}
          {parameter.type === 'numeric' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`param-min-${index}`}>Min Value</Label>
                <Input
                  id={`param-min-${index}`}
                  type="number"
                  value={parameter.minValue || ''}
                  onChange={(e) => updateParameter(index, 'minValue', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Minimum value"
                />
              </div>
              <div>
                <Label htmlFor={`param-max-${index}`}>Max Value</Label>
                <Input
                  id={`param-max-${index}`}
                  type="number"
                  value={parameter.maxValue || ''}
                  onChange={(e) => updateParameter(index, 'maxValue', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Maximum value"
                />
              </div>
            </div>
          )}

          {parameter.type === 'dropdown' && (
            <div>
              <Label htmlFor={`param-options-${index}`}>Dropdown Options (one per line)</Label>
              <textarea
                id={`param-options-${index}`}
                value={parameter.dropdownOptions?.join('\n') || ''}
                onChange={(e) => updateParameter(index, 'dropdownOptions', e.target.value)}
                onBlur={(e) => updateParameter(index, 'dropdownOptions', e.target.value.split('\n').filter(opt => opt.trim()))}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={4}
              />
              <div className="mt-2">
                <Label htmlFor={`param-acceptable-${index}`}>Acceptable Values for Pass (optional, one per line)</Label>
                <textarea
                  id={`param-acceptable-${index}`}
                  value={parameter.acceptableValues?.join('\n') || ''}
                  onChange={(e) => updateParameter(index, 'acceptableValues', e.target.value)}
                  onBlur={(e) => updateParameter(index, 'acceptableValues', e.target.value.split('\n').filter(opt => opt.trim()))}
                  placeholder="Values that result in PASS"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          {parameter.type === 'text' && (
            <div>
              <Label htmlFor={`param-maxlength-${index}`}>Max Length</Label>
              <Input
                id={`param-maxlength-${index}`}
                type="number"
                value={parameter.maxLength || ''}
                onChange={(e) => updateParameter(index, 'maxLength', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Maximum character length"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
            {template ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-gray-600 mt-1">
            Define the structure and parameters for your test template
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General details about the test template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter template name"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="raw">Raw Material</option>
                <option value="wip">Work in Progress</option>
                <option value="finished_good">Finished Good</option>
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter template description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Test Parameters</CardTitle>
                <CardDescription>
                  Define the parameters that will be tested
                </CardDescription>
              </div>
              <Button type="button" onClick={addParameter}>
                <Plus className="mr-2 h-4 w-4" />
                Add Parameter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.parameters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No parameters added yet. Click "Add Parameter" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.parameters.map((parameter, index) => (
                  <ParameterForm
                    key={parameter.id || index}
                    parameter={parameter}
                    index={index}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                {template ? 'Update Template' : 'Create Template'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;
