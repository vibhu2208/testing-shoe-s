import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { templatesAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import TemplateForm from '../components/templates/TemplateForm';
import TemplateView from '../components/templates/TemplateView';

const Templates = () => {
  const { hasRole, canModify } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'view'

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.getTemplates();
      setTemplates(response.data.templates);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setViewMode('form');
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setViewMode('form');
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setViewMode('view');
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templatesAPI.deleteTemplate(templateId);
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error('Delete template error:', err);
    }
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    fetchTemplates();
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedTemplate(null);
  };

  if (viewMode === 'form') {
    return (
      <TemplateForm
        template={selectedTemplate}
        onSuccess={handleFormSuccess}
        onCancel={handleBack}
      />
    );
  }

  if (viewMode === 'view') {
    return (
      <TemplateView
        template={selectedTemplate}
        onBack={handleBack}
        onEdit={canModify('templates') ? () => handleEditTemplate(selectedTemplate) : null}
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
          <h1 className="text-3xl font-bold text-gray-900">Test Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage dynamic test structures and parameters
          </p>
        </div>
        {canModify('templates') && (
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {template.category.replace('_', ' ')}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canModify('templates') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {template.parameters?.length || 0} parameters
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created by: {template.creator?.firstName} {template.creator?.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new test template.
          </p>
          {hasRole('admin') && (
            <div className="mt-6">
              <Button onClick={handleCreateTemplate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Templates;
