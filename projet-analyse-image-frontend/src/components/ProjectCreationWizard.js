import React, { useState, useEffect, useRef } from 'react';
import './StatusColors.css';
import { projectService, groupService, userService } from '../services/api';
import { selectDirectory } from '../services/tauriApi';
import { createProjectStructure, validateProjectStructure } from '../services/filesystemApi';
import Environment from '../utils/environmentDetection';
import WizardFormModal from './WizardFormModal';

// Predefined lists
const PREDEFINED_OPTIONS = {
  sampleTypes: [
    'cells on slides',
    'tissue slices', 
    'cells in multiwell plates',
    'whole organ / animal',
    'other'
  ],
  imagingTechniques: [
    'widefield microscopy',
    'widefield fluorescence microscopy',
    'slide scanning',
    'confocal microscopy',
    'time lapse microscopy',
    'super resolution microscopy',
    'high content screening',
    'other'
  ],
  analysisGoals: [
    'object counting',
    'intensity measurement',
    '3D reconstruction',
    'object classification',
    'object morphometry',
    'other'
  ]
};

const PREDEFINED_SOFTWARE = [
  'CellProfiler',
  'Fiji',
  'Imaris',
  'LAS X',
  'MetaMorph',
  'Nikon NIS Elements',
  'Python',
  'QuPath',
  'Zen',
  'Other'
];

// Output/Result type categories
const PREDEFINED_OUTPUT_TYPES = [
  'Counseling',
  'Video Tutorial',
  'Script',
  'Workflow/Protocol',
  'Training'
];

// Multi-select checkbox component
const MultiSelectField = ({ options, value, onChange, placeholder, fieldName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  
  const getCurrentSelections = () => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(s => s.trim()).filter(s => s);
      }
    }
    return [];
  };
  
  const currentSelections = getCurrentSelections();
  
  const handleToggleOption = (option) => {
    const newSelections = currentSelections.includes(option)
      ? currentSelections.filter(s => s !== option)
      : [...currentSelections, option];
    
    onChange(JSON.stringify(newSelections));
  };
  
  const displayText = currentSelections.length > 0 
    ? currentSelections.join(', ')
    : placeholder;

  const isAnalysisGoal = fieldName === 'analysis_goal';
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors text-sm text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 text-left flex justify-between items-center"
      >
        <span className={currentSelections.length === 0 ? 'text-gray-500' : ''}>{displayText}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
            isAnalysisGoal 
              ? 'absolute top-full left-0 right-0 mt-1 z-[9999999]' 
              : 'absolute top-full left-0 right-0 mt-1 z-50'
          }`}
        >
          {options.map((option) => (
            <div
              key={option}
              className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleToggleOption(option)}
            >
              <input
                type="checkbox"
                checked={currentSelections.includes(option)}
                onChange={() => handleToggleOption(option)}
                className="mr-2 text-bioluminescent-500 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectCreationWizard = ({ onProjectCreated, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  // Inline creation modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [inlineError, setInlineError] = useState('');
  
  // Project data state
  const [projectData, setProjectData] = useState({
    name: 'New Project',
    description: '',
    software: '',
    output_type: '',
    sample_type: '[]',
    image_types: '[]',
    analysis_goal: '[]',
    project_path: '',
    group_id: '',
    user_id: '',
    expected_hours: 8,
    status: 'Intake' // maps to "Preparing" in UI
  });
  
  // Validation and UI state
  const [errors, setErrors] = useState({});
  const [folderStatus, setFolderStatus] = useState({ isValid: false, isEmpty: true });
  const [draftProject, setDraftProject] = useState(null);

  useEffect(() => {
    // Detect environment
    setIsTauri(Environment.isTauri());
    
    // Load groups for dropdown
    const loadGroups = async () => {
      try {
        const groupsData = await groupService.getAll();
        setGroups(groupsData || []);
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };
    loadGroups();
  }, []);

  // When group changes, load users for that group
  const handleGroupChange = async (groupId) => {
    try {
      setProjectData(prev => ({ ...prev, group_id: groupId || '', user_id: '' }));
      if (groupId) {
        const usersData = await groupService.getUsers(groupId);
        setUsers(usersData || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users for group:', error);
      setUsers([]);
    }
  };

  // Create new group inline
  const handleCreateGroupInline = async () => {
    setInlineError('');
    const { name, description } = newGroup;
    if (!name || name.trim() === '') {
      setInlineError('Group name is required');
      return;
    }
    try {
      setIsLoading(true);
      const created = await groupService.create({ name: name.trim(), description: description?.trim() || '' });
      // Refresh groups and select the new one
      const groupsData = await groupService.getAll();
      setGroups(groupsData || []);
      setProjectData(prev => ({ ...prev, group_id: created.id, user_id: '' }));
      // Load users for this new group
      const usersData = await groupService.getUsers(created.id);
      setUsers(usersData || []);
      // Close modal and reset form
      setShowGroupModal(false);
      setNewGroup({ name: '', description: '' });
      // Clear any field errors
      setErrors(prev => ({ ...prev, group_id: undefined, user_id: undefined }));
    } catch (err) {
      console.error('Failed to create group inline:', err);
      setInlineError(err?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new user inline (requires group_id)
  const handleCreateUserInline = async () => {
    setInlineError('');
    if (!projectData.group_id) {
      setInlineError('Please select a group first');
      return;
    }
    const { name, email } = newUser;
    if (!name || name.trim() === '') {
      setInlineError('User name is required');
      return;
    }
    try {
      setIsLoading(true);
      const created = await userService.create({ name: name.trim(), email: email?.trim() || '', group_id: projectData.group_id });
      // Refresh users for current group and select the new one
      const usersData = await groupService.getUsers(projectData.group_id);
      setUsers(usersData || []);
      setProjectData(prev => ({ ...prev, user_id: created.id }));
      // Close modal and reset form
      setShowUserModal(false);
      setNewUser({ name: '', email: '' });
      // Clear any field errors
      setErrors(prev => ({ ...prev, user_id: undefined }));
    } catch (err) {
      console.error('Failed to create user inline:', err);
      setInlineError(err?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate suggested folder name using DATE-GROUP-USER-SOFTWARE
  const generateSuggestedPath = () => {
    const today = new Date();
    const datePart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Resolve group/user names from selections
    const groupName = (groups.find(g => String(g.id) === String(projectData.group_id))?.name) || 'Unknown-Group';
    const userName = (users.find(u => String(u.id) === String(projectData.user_id))?.name) || 'Unknown-User';
    const softwareName = projectData.software || 'Unknown-Software';

    const sanitize = (s) => (
      (s || '')
        .toString()
        .trim()
        .replace(/\s+/g, '-')        // spaces to hyphens
        .replace(/[^A-Za-z0-9_-]/g, '') // strip unsafe
        .replace(/-+/g, '-')           // collapse hyphens
        .replace(/^[-_]+|[-_]+$/g, '') // trim hyphens/underscores
    );

    // Truncate each part to keep folder length reasonable
    const maxPart = 20;
    const trunk = (s) => (s.length > maxPart ? s.slice(0, maxPart) : s);

    const parts = [
      trunk(sanitize(groupName)) || 'Unknown-Group',
      trunk(sanitize(userName)) || 'Unknown-User',
      trunk(sanitize(softwareName)) || 'Unknown-Software'
    ];

    return `${datePart}_${parts.join('_')}`.replace(/_{2,}/g, '_');
  };

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!projectData.name || projectData.name.trim() === '' || projectData.name === 'New Project') {
      newErrors.name = 'Please provide a meaningful project name';
    }
    
    if (!projectData.description || projectData.description.trim() === '') {
      newErrors.description = 'Project description is required';
    }
    
    if (!projectData.software || projectData.software.trim() === '') {
      newErrors.analysis_software = 'Please specify the analysis software to be used';
    }

    // Require group and user selection for complete project info
    if (!projectData.group_id) {
      newErrors.group_id = 'Please select a group';
    }
    if (!projectData.user_id) {
      newErrors.user_id = 'Please select a user';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!projectData.project_path || projectData.project_path.trim() === '') {
      newErrors.project_path = 'Please select a parent folder for your project';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build payload mapping UI state to backend schema
  const buildPayload = (data) => ({
    name: data.name,
    description: data.description,
    status: data.status || 'Intake',
    software: data.software || null,
    output_type: data.output_type || null,
    time_spent_minutes: 0,
    project_path: data.project_path || null,
    folder_created: data.folder_created || false,
    readme_last_updated: data.readme_last_updated || null,
    start_date: data.start_date || new Date().toISOString().split('T')[0],
    user_id: data.user_id || null,
    image_types: data.image_types || null,
    sample_type: data.sample_type || null,
    objective_magnification: data.objective_magnification || null,
    analysis_goal: data.analysis_goal || null
  });

  // Save or update draft project (single create; subsequent calls update)
  const saveDraft = async (data) => {
    try {
      const payload = buildPayload(data);
      if (draftProject) {
        const updated = await projectService.update(draftProject.id, payload);
        setDraftProject(updated);
        return updated;
      } else {
        const created = await projectService.create(payload);
        setDraftProject(created);
        return created;
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  };

  // Handle input changes with auto-save
  const handleInputChange = async (field, value) => {
    const newData = { ...projectData, [field]: value };
    setProjectData(newData);
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // No aggressive auto-save to avoid duplicate creations; we save on Next (Step 1) and after folder selection
  };

  // Handle folder selection
  const handleSelectFolder = async () => {
    try {
      setIsLoading(true);
      
      if (isTauri) {
        const selectedPath = await selectDirectory();
        if (selectedPath) {
          const fullPath = `${selectedPath}\\${generateSuggestedPath()}`;
          await handleInputChange('project_path', fullPath);
          
          // Validate selected folder
          try {
            const validation = await validateProjectStructure(fullPath, false);
            setFolderStatus({
              isValid: validation.has_valid_structure,
              isEmpty: validation.is_empty
            });
            // Persist path to draft if it exists
            if (draftProject) {
              await saveDraft({ ...projectData, project_path: fullPath });
            }
          } catch (validationError) {
            console.log('Folder validation failed, assuming empty');
            setFolderStatus({ isValid: false, isEmpty: true });
          }
        }
      } else {
        // Web mode - show path input
        const path = prompt('Enter the full path where your project folder should be created:');
        if (path) {
          const fullPath = `${path}/${generateSuggestedPath()}`;
          await handleInputChange('project_path', fullPath);
          setFolderStatus({ isValid: false, isEmpty: true });
          if (draftProject) {
            await saveDraft({ ...projectData, project_path: fullPath });
          }
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      try { window.toast?.('Failed to select folder: ' + (error.message || 'Unknown error'), { type: 'error' }); } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        if (isLoading) return;
        setIsLoading(true);
        // Create or update draft exactly once here to avoid duplicates
        try {
          await saveDraft(projectData);
          setCurrentStep(2);
        } catch (error) {
          try { window.toast?.('Failed to save project information. Please try again.', { type: 'error' }); } catch {}
        } finally {
          setIsLoading(false);
        }
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  // Handle project creation completion
  const handleCompleteCreation = async () => {
    try {
      setIsLoading(true);
      
      if (!draftProject) {
        throw new Error('No draft project found');
      }

      // Create folder structure
      const result = await createProjectStructure(
        projectData.project_path,
        projectData.name,
        projectData.description
      );
      
      // Update project to mark as completed
      const completedProject = await projectService.update(draftProject.id, buildPayload({
        ...projectData,
        folder_created: true,
        readme_last_updated: result,
        status: 'Active'
      }));
      
      // Notify parent component
      onProjectCreated(completedProject);
      
    } catch (error) {
      console.error('Failed to complete project creation:', error);
      try { window.toast?.('Failed to create project structure: ' + (error.message || 'Unknown error'), { type: 'error' }); } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (draftProject) {
      if (window.confirm('Are you sure you want to cancel? Your draft will be deleted.')) {
        try {
          await projectService.delete(draftProject.id);
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Input styles
  const inputBaseClasses = "w-full px-3 py-2 bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors text-sm text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg transition-all duration-300";
  const errorClasses = "ring-2 ring-red-300 dark:ring-red-600";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-night-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Project
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Follow these simple steps to set up your bioimage analysis project
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep >= 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
              'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > 1 ? 'bg-green-600 text-white' :
                currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="font-medium">Project Info</span>
            </div>

            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            {/* Step 2 */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep >= 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
              'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > 2 ? 'bg-green-600 text-white' :
                currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className="font-medium">Select Folder</span>
            </div>

            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            {/* Step 3 */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep >= 3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
              'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
              }`}>
                3
              </div>
              <span className="font-medium">Create Structure</span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-night-800 rounded-2xl border border-gray-200 dark:border-night-600 shadow-sm p-8">
          
          {/* Step 1: Project Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Project Information
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell us about your bioimage analysis project
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`${inputBaseClasses} ${errors.name ? errorClasses : ''}`}
                    placeholder="Enter a meaningful project name"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Analysis Software */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analysis Software *
                  </label>
                  <select
                    value={projectData.software}
                    onChange={(e) => handleInputChange('software', e.target.value)}
                    className={`${inputBaseClasses} ${errors.analysis_software ? errorClasses : ''}`}
                  >
                    <option value="">Select software</option>
                    {PREDEFINED_SOFTWARE.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {projectData.software === 'Other' && (
                    <input
                      type="text"
                      className={`${inputBaseClasses} mt-2`}
                      placeholder="Enter software name"
                      onChange={(e) => handleInputChange('software', e.target.value)}
                    />
                  )}
                  {errors.analysis_software && (
                    <p className="text-red-600 text-xs mt-1">{errors.analysis_software}</p>
                  )}
                </div>
              </div>

              {/* Output/Result Type */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Output / Result Type
                  </label>
                  <select
                    value={projectData.output_type}
                    onChange={(e) => handleInputChange('output_type', e.target.value)}
                    className={inputBaseClasses}
                  >
                    <option value="">Select output type (optional)</option>
                    {PREDEFINED_OUTPUT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`${inputBaseClasses} ${errors.description ? errorClasses : ''}`}
                  placeholder="Describe your project goals, methods, and expected outcomes"
                  rows="3"
                />
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Multi-select fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sample Types
                  </label>
                  <MultiSelectField
                    options={PREDEFINED_OPTIONS.sampleTypes}
                    value={projectData.sample_type}
                    onChange={(value) => handleInputChange('sample_type', value)}
                    placeholder="Select sample types"
                    fieldName="sample_type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imaging Techniques
                  </label>
                  <MultiSelectField
                    options={PREDEFINED_OPTIONS.imagingTechniques}
                    value={projectData.image_types}
                    onChange={(value) => handleInputChange('image_types', value)}
                    placeholder="Select imaging techniques"
                    fieldName="image_types"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analysis Goals
                  </label>
                  <MultiSelectField
                    options={PREDEFINED_OPTIONS.analysisGoals}
                    value={projectData.analysis_goal}
                    onChange={(value) => handleInputChange('analysis_goal', value)}
                    placeholder="Select analysis goals"
                    fieldName="analysis_goal"
                  />
                </div>
              </div>

              {/* Group and User selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group *
                  </label>
                  <div className="flex gap-2 items-start">
                    <select
                      value={projectData.group_id}
                      onChange={(e) => handleGroupChange(e.target.value)}
                      className={`${inputBaseClasses} ${errors.group_id ? errorClasses : ''} flex-1`}
                    >
                      <option value="">Select a group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setInlineError(''); setShowGroupModal(true); }}
                      className="px-3 py-2 bg-bioluminescent-50 dark:bg-bioluminescent-900/20 text-bioluminescent-700 dark:text-bioluminescent-300 rounded-xl border border-bioluminescent-200 dark:border-bioluminescent-700/50 hover:bg-bioluminescent-100 dark:hover:bg-bioluminescent-900/40 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      + New Group
                    </button>
                  </div>
                  {errors.group_id && (
                    <p className="text-red-600 text-xs mt-1">{errors.group_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User *
                  </label>
                  <div className="flex gap-2 items-start">
                    <select
                      value={projectData.user_id}
                      onChange={(e) => handleInputChange('user_id', e.target.value)}
                      className={`${inputBaseClasses} ${errors.user_id ? errorClasses : ''} flex-1`}
                      disabled={!projectData.group_id}
                    >
                      <option value="">Select a user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <div className="relative group/newuser">
                      <button
                        type="button"
                        onClick={() => { if (!projectData.group_id) return; setInlineError(''); setShowUserModal(true); }}
                        disabled={!projectData.group_id}
                        className={`px-3 py-2 rounded-xl border transition-colors text-sm font-medium whitespace-nowrap ${
                          projectData.group_id
                            ? 'bg-bioluminescent-50 dark:bg-bioluminescent-900/20 text-bioluminescent-700 dark:text-bioluminescent-300 border-bioluminescent-200 dark:border-bioluminescent-700/50 hover:bg-bioluminescent-100 dark:hover:bg-bioluminescent-900/40'
                            : 'bg-gray-100 dark:bg-night-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-night-700 cursor-not-allowed opacity-60'
                        }`}
                      >
                        + New User
                      </button>
                      {!projectData.group_id && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/newuser:block z-10">
                          <div className="bg-gray-900 dark:bg-night-600 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                            Select a group first
                          </div>
                          <div className="w-2 h-2 bg-gray-900 dark:bg-night-600 rotate-45 mx-auto -mt-1"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.user_id && (
                    <p className="text-red-600 text-xs mt-1">{errors.user_id}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Folder Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select Project Location
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose where to create your project folder
                </p>
              </div>

              {/* Suggested folder name */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Suggested Project Folder Name (DATE_GROUP_USER_SOFTWARE):
                </h3>
                <code className="text-blue-900 dark:text-blue-100 font-mono text-sm bg-blue-100 dark:bg-blue-800/30 px-2 py-1 rounded">
                  {generateSuggestedPath()}
                </code>
              </div>

              {/* Path selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Path *
                </label>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={projectData.project_path}
                    readOnly
                    className={`${inputBaseClasses} ${errors.project_path ? errorClasses : ''} flex-1`}
                    placeholder="Click Browse to select parent folder"
                  />
                  <button
                    onClick={handleSelectFolder}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Selecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Browse
                      </>
                    )}
                  </button>
                </div>
                
                {errors.project_path && (
                  <p className="text-red-600 text-xs mt-1">{errors.project_path}</p>
                )}

                {/* Folder status */}
                {projectData.project_path && (
                  <div className="mt-4">
                    {folderStatus.isValid ? (
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm">Valid project structure already exists - will be updated</span>
                      </div>
                    ) : folderStatus.isEmpty ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">Ready to create project structure</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm">Folder is not empty - structure will be created with confirmation</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
            {/* Inline Creation Modals */}
            <WizardFormModal
              isOpen={showGroupModal}
              title="Create New Group"
              inlineError={inlineError}
              onClose={() => setShowGroupModal(false)}
              onSubmit={(e) => { e.preventDefault(); handleCreateGroupInline(); }}
              submitLabel={isLoading ? 'Creating…' : 'Create Group'}
              loading={isLoading}
              disabled={!newGroup.name}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className={inputBaseClasses}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  className={inputBaseClasses}
                  placeholder="Short description (optional)"
                />
              </div>
            </WizardFormModal>

            <WizardFormModal
              isOpen={showUserModal}
              title="Create New User"
              inlineError={inlineError}
              onClose={() => setShowUserModal(false)}
              onSubmit={(e) => { e.preventDefault(); handleCreateUserInline(); }}
              submitLabel={isLoading ? 'Creating…' : 'Create User'}
              loading={isLoading}
              disabled={!newUser.name}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className={inputBaseClasses}
                  placeholder="Enter user's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className={inputBaseClasses}
                  placeholder="name@example.com (optional)"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Group: <span className="font-medium">{(groups.find(g => String(g.id) === String(projectData.group_id))?.name) || 'Not selected'}</span></div>
            </WizardFormModal>


          {/* Step 3: Create Structure */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Create Project Structure
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Ready to create your bioimage analysis project
                </p>
              </div>

              {/* Project summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Project Summary:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{projectData.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Software:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{projectData.software}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs break-all">{projectData.project_path}</span>
                  </div>
                </div>
              </div>

              {/* Creation action */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Click the button below to create your project folder structure and README file.
                </p>
                
                <button
                  onClick={handleCompleteCreation}
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-3 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Project Structure
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-xl font-medium transition-all duration-200"
                >
                  Back
                </button>
              )}
              
              {currentStep < 3 && (
                <button
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWizard;