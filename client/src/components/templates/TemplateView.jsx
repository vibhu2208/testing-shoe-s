import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Edit, FileText } from 'lucide-react';

const TemplateView = ({ template, onBack, onEdit }) => {
  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Template not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>
    );
  }

  const getParameterTypeIcon = (type) => {
    switch (type) {
      case 'numeric':
        return '🔢';
      case 'text':
        return '📝';
      case 'dropdown':
        return '📋';
      case 'boolean':
        return '✅';
      default:
        return '❓';
    }
  };

  const formatParameterDetails = (parameter) => {
    const details = [];
    
    if (parameter.type === 'numeric') {
      if (parameter.minValue !== null) details.push(`Min: ${parameter.minValue}`);
      if (parameter.maxValue !== null) details.push(`Max: ${parameter.maxValue}`);
    }
    
    if (parameter.type === 'text' && parameter.maxLength) {
      details.push(`Max Length: ${parameter.maxLength}`);
    }
    
    if (parameter.type === 'dropdown') {
      details.push(`${parameter.dropdownOptions?.length || 0} options`);
    }
    
    return details.join(' • ');
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
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600 mt-1">
              <span className="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                {template.category.replace('_', ' ')}
              </span>
              {template.isActive ? (
                <span className="ml-2 inline-flex px-2 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="ml-2 inline-flex px-2 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        )}
      </div>

      {/* Template Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Name</h4>
              <p className="text-gray-600">{template.name}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Category</h4>
              <p className="text-gray-600 capitalize">
                {template.category.replace('_', ' ')}
              </p>
            </div>
            
            {template.description && (
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-gray-600">{template.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Status</h4>
              <p className="text-gray-600">
                {template.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Created By</h4>
              <p className="text-gray-600">
                {template.creator?.firstName} {template.creator?.lastName}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Created Date</h4>
              <p className="text-gray-600">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Parameters</h4>
              <p className="text-gray-600">
                {template.parameters?.length || 0} parameters defined
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parameters List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Parameters</CardTitle>
              <CardDescription>
                Parameters that will be tested when this template is used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.parameters && template.parameters.length > 0 ? (
                <div className="space-y-4">
                  {template.parameters
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((parameter, index) => (
                    <div
                      key={parameter.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getParameterTypeIcon(parameter.type)}</span>
                            <h4 className="font-medium text-gray-900">
                              {parameter.name}
                            </h4>
                            <span className="text-sm text-gray-500">
                              #{parameter.sequenceOrder}
                            </span>
                            {parameter.isMandatory && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Type:</span> {parameter.type}
                            </p>
                            
                            {formatParameterDetails(parameter) && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Details:</span> {formatParameterDetails(parameter)}
                              </p>
                            )}
                            
                            {parameter.type === 'dropdown' && parameter.dropdownOptions && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Options:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parameter.dropdownOptions.map((option, optIndex) => (
                                    <span
                                      key={optIndex}
                                      className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                                
                                {parameter.acceptableValues && parameter.acceptableValues.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700">Pass Values:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {parameter.acceptableValues.map((value, valIndex) => (
                                        <span
                                          key={valIndex}
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No parameters defined for this template</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>
            How this template will be used in test executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600">
              When this template is assigned to a tester, they will be presented with a dynamic form 
              containing all the parameters defined above. The system will automatically validate 
              the entered values based on the parameter types and constraints:
            </p>
            
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>
                <strong>Numeric parameters:</strong> Values will be checked against min/max ranges if specified
              </li>
              <li>
                <strong>Text parameters:</strong> Length will be validated against max length if specified
              </li>
              <li>
                <strong>Dropdown parameters:</strong> Only predefined options will be selectable
              </li>
              <li>
                <strong>Boolean parameters:</strong> Simple yes/no or pass/fail selection
              </li>
            </ul>
            
            <p className="mt-4 text-gray-600">
              The overall test result will be automatically calculated as PASS only if all parameters 
              meet their validation criteria. If any parameter fails validation, the overall result 
              will be marked as FAIL.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateView;
