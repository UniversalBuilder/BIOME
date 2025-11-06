import React, { useState, useEffect, useCallback, useRef } from 'react';
import './StatusColors.css';
import { Tooltip } from './Tooltip';
import { projectService, groupService } from '../services/api';
import { selectDirectory } from '../services/tauriApi';
import { createProjectStructure, validateProjectStructure, updateReadme, scanProjectFolder, downloadReadmeTemplate } from '../services/filesystemApi';
import Modal from './Modal';
import WizardFormModal from './WizardFormModal';
import Environment from '../utils/environmentDetection';

const MAX_HOURS = 48;

// Predefined category options
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

// Output/Result type categories
const PREDEFINED_OUTPUT_TYPES = [
  'Counseling',
  'Video Tutorial',
  'Script',
  'Workflow/Protocol',
  'Training'
];

// Monochrome pictogram per Output/Result Type
const renderOutputTypeIcon = (type) => {
  const common = 'w-4 h-4';
  switch ((type || '').toLowerCase()) {
    case 'video tutorial':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.752 11.168l-4.596-2.65A1 1 0 008 9.35v5.3a1 1 0 001.156.832l4.596-2.65a1 1 0 000-1.664z" />
          <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
        </svg>
      );
    case 'script':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 16l-4-4 4-4" />
          <path d="M16 8l4 4-4 4" />
        </svg>
      );
    case 'workflow/protocol':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M8 6h8M12 8v6" />
        </svg>
      );
    case 'training':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10l-10-5-10 5 10 5 10-5z" />
          <path d="M6 12v5a6 6 0 0012 0v-5" />
        </svg>
      );
    case 'counseling':
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
        </svg>
      );
  }
};

// Multi-select checkbox component
const MultiSelectField = ({ options, value, onChange, placeholder, fieldName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  
  // Parse current value (handle both string and array formats)
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
    
    // Store as JSON string for consistency with database
    onChange(JSON.stringify(newSelections));
  };
  
  const displayText = currentSelections.length > 0 
    ? currentSelections.join(', ')
    : placeholder;

  // For analysis_goal field, use a simpler approach - just break out of stacking context
  const isAnalysisGoal = fieldName === 'analysis_goal';
  
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };
    
  // Default rendering for other fields
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => handleToggleDropdown()}
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
              : 'absolute top-full left-0 right-0 mt-1 z-[999999]'
          }`}
          style={{ 
            transform: isAnalysisGoal ? 'translateZ(0)' : 'none',
            isolation: isAnalysisGoal ? 'isolate' : 'auto'
          }}
        >
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={currentSelections.includes(option)}
                onChange={() => handleToggleOption(option)}
                className="mr-2 text-bioluminescent-500 focus:ring-bioluminescent-300"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      {/* Clickaway overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999998]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Reserved for future date formatting implementation
// eslint-disable-next-line no-unused-vars
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    // Handle both ISO strings and date-only strings
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

const formatTimeSpent = (minutes) => {
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const getTimeSpentColor = (minutes) => {
  const hours = minutes / 60;
  if (hours >= MAX_HOURS) return 'text-red-600 dark:text-red-400 font-semibold';
  if (hours >= MAX_HOURS * 0.75) return 'text-orange-500 dark:text-orange-300';
  if (hours >= MAX_HOURS * 0.5) return 'text-yellow-500 dark:text-yellow-300';
  return 'text-green-600 dark:text-bioluminescent-400';
};

const getTimeSpentBarColor = (minutes) => {
  const hours = minutes / 60;
  if (hours >= MAX_HOURS) return 'bg-red-500 dark:bg-red-400';
  if (hours >= MAX_HOURS * 0.75) return 'bg-orange-400 dark:bg-orange-300';
  if (hours >= MAX_HOURS * 0.5) return 'bg-yellow-400 dark:bg-yellow-300';
  return 'bg-green-500 dark:bg-bioluminescent-500';
};

function ProjectDetails({ project, onProjectUpdate, onProjectSelect, isNewProject, setIsNewProject, showScroll = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localEditingData, setLocalEditingData] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [localJournalEntries, setLocalJournalEntries] = useState([]);
  const [showEditJournalModal, setShowEditJournalModal] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState(null);
  const [editingJournalText, setEditingJournalText] = useState('');
  const [showDeleteJournalModal, setShowDeleteJournalModal] = useState(false);
  const [deletingJournalEntry, setDeletingJournalEntry] = useState(null);
  const [isTauri, setIsTauri] = useState(false);
  const [folderStatus, setFolderStatus] = useState({ isValid: false, isEmpty: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Resources (reference files)
  const [resources, setResources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [, setSavingCaptionId] = useState(null);
  // Used in the web fallback path selection system - see handleBrowseProjectFolder function
  const [isPathFallbackOpen, setIsPathFallbackOpen] = useState(false); 
  // Used to store suggested project paths for web fallback - see handleBrowseProjectFolder function
  const [suggestedPaths] = useState([]); // setSuggestedPaths currently unused but may be needed for future features
  const [showWebFolderModal, setShowWebFolderModal] = useState(false);
  const [generatedStructureContent, setGeneratedStructureContent] = useState(null);

  // Define common classes
  const inputBaseClasses = "w-full px-3 py-2 bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors text-sm text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg transition-all duration-300";

  // Check if the app is running in Tauri environment
  useEffect(() => {
    const checkTauriEnvironment = () => {
      const result = Environment.isTauri();
      console.log('Tauri environment detection result:', result);
      setIsTauri(result);
    };

    // Check on mount and after a short delay to ensure window.__TAURI__ is loaded
    checkTauriEnvironment();
    
    // Double check after a delay to make sure Tauri API is fully initialized
    // Use multiple checks with increasing delays to ensure we catch the API initialization
    const timer1 = setTimeout(() => {
      checkTauriEnvironment();
    }, 500);
    
    const timer2 = setTimeout(() => {
      checkTauriEnvironment();
    }, 1000);
    
    const timer3 = setTimeout(() => {
      checkTauriEnvironment();
    }, 2000);
    
    // If running in development mode, add a manual override option
    if (process.env.NODE_ENV === 'development') {
      // Check URL parameters for force mode
      const urlParams = new URLSearchParams(window.location.search);
      const forceMode = urlParams.get('mode');
      
      if (forceMode === 'tauri') {
        console.log('Force enabling Tauri mode via URL parameter');
        setIsTauri(true);
      } else if (forceMode === 'web') {
        console.log('Force enabling Web mode via URL parameter');
        setIsTauri(false);
      }
      
      // Add keyboard shortcut to toggle mode (Ctrl+Alt+T)
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.altKey && e.key === 't') {
          console.log('Manually toggling Tauri mode via keyboard shortcut');
          setIsTauri(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Initialize local journal entries when project changes
  useEffect(() => {
    if (project?.journal_entries) {
      setLocalJournalEntries(project.journal_entries);
    } else {
      // Reset to empty array when project doesn't have journal entries
      // or when switching to a project without entries
      setLocalJournalEntries([]);
    }
  }, [project]);

  // Load groups and users when project changes
  useEffect(() => {
    if (project) {
      // Load all available groups
      groupService.getAll()
        .then(groupsData => {
          setGroups(groupsData || []);
          
          // If project has a group_id, also load users for that group
          if (project.group_id) {
            return groupService.getUsers(project.group_id)
              .then(usersData => {
                setUsers(usersData || []);
              });
          }
        })
        .catch(error => {
          console.error('Error loading groups/users for project view:', error);
        });
    }
  }, [project]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
    setLocalEditingData(project);
  }, [project]);

  // Only handle new project initialization
  useEffect(() => {
    if (isNewProject) {
      handleStartEditing();
    }
  }, [isNewProject, handleStartEditing]);

  // Handle group changes independently
  const handleGroupChange = (groupId) => {
    if (!groupId) {
      setUsers([]);
      handleInputChange('group_id', '');
      handleInputChange('user_id', '');
      return;
    }

    handleInputChange('group_id', groupId);
    handleInputChange('user_id', '');
    
    groupService.getUsers(groupId)
      .then(usersData => setUsers(usersData || []))
      .catch(error => {
        console.error('Error loading users:', error);
        setUsers([]);
      });
  };

  const handleInputChange = useCallback((field, value) => {
    if (!isEditing) return;
    
    // Special debug logging for project_path
    if (field === 'project_path') {
      console.log(`Setting project_path: '${value}'`);
    }
    
    setLocalEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [isEditing]);

  // Helper function to determine if the project is saved and has a valid ID
  const isProjectSaved = () => {
    return project && project.id && !project.isTemp && !isNewProject;
  };

  // Helper function to check if we have adequate project information for folder creation
  const hasAdequateProjectInfo = useCallback(() => {
    const data = isEditing && localEditingData ? localEditingData : project;
    if (!data) {
      console.log('❌ hasAdequateProjectInfo: No project data');
      return false;
    }
    
    // Require essential information for bioimage analysis projects
    const hasName = data.name && String(data.name).trim() !== '' && data.name !== 'New Project';
    // Description is OPTIONAL - not required for folder creation
    const hasDescription = true; // Always true since description is optional
    const hasSoftware = data.software && String(data.software).trim() !== '';
    
    // Check for group - either group_id or group_name should exist
    const hasGroup = (data.group_id && String(data.group_id).trim() !== '') || 
                     (data.group_name && String(data.group_name).trim() !== '');
    
    // Check for user - either user_id or user_name should exist  
    const hasUser = (data.user_id && String(data.user_id).trim() !== '') || 
                    (data.user_name && String(data.user_name).trim() !== '');
    
    const isValid = hasName && hasDescription && hasSoftware && hasGroup && hasUser;
    
    // Only log when validation state changes or when explicitly debugging
    if (!isValid) {
      console.log('❌ hasAdequateProjectInfo: INVALID - Missing:', {
        name: hasName ? '✅' : '❌ ' + (data.name || 'undefined'),
        'description (optional)': '✅ ' + (data.description || 'not provided'),
        software: hasSoftware ? '✅' : '❌ ' + (data.software || 'undefined'),
        group: hasGroup ? '✅' : '❌ group_id: ' + (data.group_id || 'undefined') + ', group_name: ' + (data.group_name || 'undefined'),
        user: hasUser ? '✅' : '❌ user_id: ' + (data.user_id || 'undefined') + ', user_name: ' + (data.user_name || 'undefined')
      });
    } else {
      console.log('✅ hasAdequateProjectInfo: VALID - All required fields present');
    }
    
    return isValid;
  }, [isEditing, localEditingData, project]);

  const handleSave = async () => {
    if (!localEditingData) return;
    
    try {
      const projectToSave = {
        name: localEditingData.name || 'New Project',
        description: localEditingData.description,
        status: localEditingData.status || 'Intake',
        software: localEditingData.software,
        output_type: localEditingData.output_type || null,
        time_spent_minutes: localEditingData.time_spent_minutes || 0,
        project_path: localEditingData.project_path,
        folder_created: localEditingData.folder_created,
        readme_last_updated: localEditingData.readme_last_updated,
        start_date: localEditingData.start_date || new Date().toISOString().split('T')[0],
        user_id: localEditingData.user_id,
        group_id: localEditingData.group_id,
        image_types: localEditingData.image_types,
        sample_type: localEditingData.sample_type,
        objective_magnification: localEditingData.objective_magnification,
        analysis_goal: localEditingData.analysis_goal
      };

      console.log('Saving project with data:', JSON.stringify(projectToSave, null, 2));
      
      let savedProject;
      if (project.isTemp || !project.id || isNewProject) {
        // This is a new project - create it
        savedProject = await projectService.create(projectToSave);
        console.log('Created new project:', savedProject);
      } else {
        // This is an existing project - update it
        console.log('Updating project with new field values:', {
          image_types: projectToSave.image_types,
          sample_type: projectToSave.sample_type,
          objective_magnification: projectToSave.objective_magnification,
          analysis_goal: projectToSave.analysis_goal
        });
        await projectService.update(project.id, projectToSave);
        savedProject = await projectService.getById(project.id);
        console.log('Updated existing project:', savedProject);
      }
      
      onProjectSelect(savedProject);
      onProjectUpdate(); // Call this to refresh the projects list
      
      // Force refresh of activities to show recent changes
      if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
        // Small delay to ensure the backend has processed the activity record
        setTimeout(() => {
          if (window.refreshActivities) {
            window.refreshActivities();
          }
        }, 500);
      }
      
      setIsEditing(false);
      setLocalEditingData(null);
      if (isNewProject) {
        setIsNewProject(false);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleCancel = () => {
    setLocalEditingData(null);
    setIsEditing(false);
  };

  // Reserved for future implementation
  // eslint-disable-next-line no-unused-vars
  const refreshProjectData = async () => {
    const freshProject = await projectService.getById(project.id);
    onProjectSelect(freshProject);
  };

  // Map legacy status names to new ones for display
  const mapStatusName = (status) => {
    const statusMap = {
      'Intake': 'Preparing',
      'In Progress': 'Active',
      'In-Progress': 'Active',
      'Waiting': 'Review',
      'Pending': 'Preparing',
      'Planning': 'Preparing',
      'Finished': 'Completed'
    };
    return statusMap[status] || status || 'Preparing';
  };

  const getStatusColor = (status) => {
    const mappedStatus = mapStatusName(status);
    if (!mappedStatus) return 'status-badge status-Preparing';
    const formattedStatus = mappedStatus.split(' ').join('-');
    return `status-badge status-${formattedStatus}`;
  };

  const statusOptions = [
    'Preparing',
    'Active',
    'Review',
    'On Hold',
    'Completed',
    'Cancelled'
  ];

  // Handle project selection changes specifically for journal entries
  useEffect(() => {
    // This effect specifically handles project switching
    // to ensure journal entries are properly reset/updated
    if (project?.id) {
      console.log(`Loading journal entries for project ${project.id} (${project.name || 'unknown'})`);
      
      // Always fetch fresh journal entries when project changes
      projectService.getById(project.id)
        .then(freshProject => {
          if (freshProject?.journal_entries) {
            console.log(`Found ${freshProject.journal_entries.length} journal entries`);
            setLocalJournalEntries(freshProject.journal_entries);
          } else {
            console.log('No journal entries found for this project');
            setLocalJournalEntries([]);
          }
        })
        .catch(err => {
          console.error('Failed to load journal entries:', err);
          setLocalJournalEntries([]);
        });
    }
  }, [project?.id, project?.name]); // Include both id and name since they're used in the effect

  const handleAddJournalEntry = async () => {
    if (!journalEntry.trim() || !project?.id) {
      alert('Please enter some text for the journal entry');
      return;
    }
    
    try {
      const response = await projectService.addJournalEntry(project.id, journalEntry.trim());
      
      // Update local journal entries immediately
      const newEntry = {
        id: response.id || Date.now(), // Use the returned ID or generate a temporary one
        entry_date: new Date().toISOString(),
        entry_text: journalEntry.trim(),
        project_id: project.id
      };
      
      // Add the new entry at the start of the array
      setLocalJournalEntries(prev => [newEntry, ...prev]);
      setJournalEntry('');
      
      // Get fresh project data without reloading the whole page
      try {
        const freshProject = await projectService.getById(project.id);
        // Only update journal entries, not the whole project to avoid UI jumps
        if (freshProject?.journal_entries) {
          setLocalJournalEntries(freshProject.journal_entries);
        }
        
        // Also update the project list to reflect new journal activity
        onProjectUpdate();
      } catch (refreshErr) {
        console.error('Failed to refresh project data:', refreshErr);
        // Even if refresh fails, the entry was already added to localJournalEntries
      }
    } catch (err) {
      console.error('Failed to add journal entry:', err);
      alert('Failed to add journal entry. Please try again.');
    }
  };

  const openEditJournal = (entry) => {
    setEditingJournalEntry(entry);
    setEditingJournalText(entry.entry_text || '');
    setShowEditJournalModal(true);
  };

  const handleSaveEditedJournal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingJournalEntry || !project?.id) return;
    const newText = (editingJournalText || '').trim();
    if (!newText) {
      alert('Please enter some text for the journal entry');
      return;
    }
    try {
      const edited = await projectService.editJournalEntry(project.id, editingJournalEntry.id, newText, project?.user_name || null);
      // Update local list in-place
      setLocalJournalEntries(prev => prev.map(e => e.id === editingJournalEntry.id ? { ...e, ...edited, entry_date: new Date(edited.entry_date).toISOString() } : e));
      setShowEditJournalModal(false);
      setEditingJournalEntry(null);
      setEditingJournalText('');
      // Optionally refresh activities/list
      onProjectUpdate?.();
    } catch (err) {
      console.error('Failed to edit journal entry:', err);
      alert('Failed to edit journal entry. Please try again.');
    }
  };

  const openDeleteJournal = (entry) => {
    setDeletingJournalEntry(entry);
    setShowDeleteJournalModal(true);
  };

  const handleConfirmDeleteJournal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!deletingJournalEntry || !project?.id) return;
    try {
      await projectService.deleteJournalEntry(project.id, deletingJournalEntry.id);
      setLocalJournalEntries(prev => prev.filter(e => e.id !== deletingJournalEntry.id));
      setShowDeleteJournalModal(false);
      setDeletingJournalEntry(null);
      onProjectUpdate?.();
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      alert('Failed to delete journal entry. Please try again.');
    }
  };

  // Simple line diff for preview (low-risk)
  const computeLineDiff = (before, after) => {
    const a = (before || '').split(/\r?\n/);
    const b = (after || '').split(/\r?\n/);
    const max = Math.max(a.length, b.length);
    const diffs = [];
    for (let i = 0; i < max; i++) {
      const left = a[i] ?? '';
      const right = b[i] ?? '';
      if (left === right) diffs.push({ type: 'same', left, right });
      else if (left && !right) diffs.push({ type: 'removed', left, right: '' });
      else if (!left && right) diffs.push({ type: 'added', left: '', right });
      else diffs.push({ type: 'changed', left, right });
    }
    return diffs;
  };

  const displayData = isEditing && localEditingData ? localEditingData : project;

  // Compute API base URL (mirror of services/api.js)
  const getApiBase = () => {
    const isTauriEnv = Environment.isTauri();
    if (isTauriEnv) return 'http://localhost:3001/api';
    if (process.env.NODE_ENV === 'production') {
      const port = localStorage.getItem('biome_backend_port') || '3001';
      return `http://localhost:${port}/api`;
    }
    return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  };

  const loadResources = useCallback(async () => {
    try {
      if (!project?.id) return;
      const items = await projectService.getResources(project.id);
      setResources(items || []);
    } catch (e) {
      console.error('Failed to load resources', e);
      setResources([]);
    }
  }, [project?.id]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !project?.id) return;
    setUploading(true);
    try {
      const onlySupported = files.filter(f => ['image/jpeg','image/png'].includes(f.type));
      if (!onlySupported.length) { alert('Only JPEG or PNG images are allowed.'); return; }
      await projectService.uploadResources(project.id, onlySupported);
      await loadResources();
    } catch (err) {
      console.error('Upload images failed', err);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadDocs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !project?.id) return;
    setUploading(true);
    try {
      const allowed = new Set(['application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
      const onlySupported = files.filter(f => allowed.has(f.type));
      if (!onlySupported.length) { alert('Only PDF, TXT, or Word documents are allowed.'); return; }
      await projectService.uploadResources(project.id, onlySupported);
      await loadResources();
    } catch (err) {
      console.error('Upload documents failed', err);
      alert('Failed to upload documents');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveCaption = async (resId, caption) => {
    try {
      setSavingCaptionId(resId);
      await projectService.updateResource(project.id, resId, { caption });
      await loadResources();
    } catch (err) {
      console.error('Failed to save caption', err);
      alert('Failed to save caption');
    } finally {
      setSavingCaptionId(null);
    }
  };

  const handleDeleteResource = async (resId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await projectService.deleteResource(project.id, resId);
      await loadResources();
    } catch (err) {
      console.error('Failed to delete resource', err);
      alert('Failed to delete resource');
    }
  };

  const handleUpdateReadmeResources = async () => {
    try {
      const result = await projectService.updateReadmeResources(project.id);
      alert(`README resources section updated (${result.readme})`);
    } catch (err) {
      console.error('Failed to update README resources', err);
      alert('Failed to update README resources');
    }
  };

  useEffect(() => {
    const validateFolder = async () => {
      if (!displayData?.project_path) {
        setFolderStatus({ isValid: false, isEmpty: false });
        return;
      }

      try {
        // If we're in Tauri, use the enhanced validation
        if (isTauri) {
          console.log('📂 Validating folder using enhanced Tauri API...');
          try {
            const folderScanResult = await scanProjectFolder(displayData.project_path);
            console.log('Enhanced folder scan result:', folderScanResult);
            
            // Check if this is a valid bioimage analysis structure
            const isValidStructure = folderScanResult.structure_valid;
            const missingFolders = folderScanResult.missing_folders || [];
            const folderDetails = folderScanResult.folder_details || {};
            
            // Determine if folder is effectively empty (no significant content)
            const totalFiles = Object.values(folderDetails).reduce((sum, details) => sum + (details.file_count || 0), 0);
            const isEffectivelyEmpty = totalFiles === 0 || (totalFiles < 5 && missingFolders.length > 3);
            
            setFolderStatus({
              isValid: isValidStructure,
              isEmpty: isEffectivelyEmpty,
              missingFolders: missingFolders,
              folderDetails: folderDetails
            });
            
            console.log('✅ Enhanced folder validation:', { 
              isValid: isValidStructure, 
              isEmpty: isEffectivelyEmpty,
              missingCount: missingFolders.length,
              totalFiles
            });
            
            // If the folder has a valid structure but our local state doesn't reflect it,
            // update the project state
            if (isValidStructure && !displayData.folder_created) {
              handleInputChange('folder_created', true);
            }
            
          } catch (scanError) {
            console.error('Enhanced folder scan failed, falling back to basic validation:', scanError);
            // Fallback to basic validation if enhanced scanning fails
            const result = await validateProjectStructure(displayData.project_path, displayData.folder_created);
            setFolderStatus({
              isValid: result.has_valid_structure,
              isEmpty: result.is_empty
            });

            if (result.has_valid_structure && !displayData.folder_created) {
              handleInputChange('folder_created', true);
            }
          }
        } else {
          // In development mode without Tauri, simulate validation
          if (process.env.NODE_ENV === 'development') {
            console.log('DEV: Simulating folder validation for:', displayData.project_path);
            
            // Logic to infer folder status from path
            const pathLower = displayData.project_path.toLowerCase();
            
            // Check if path is likely new/empty by looking at folder name patterns
            // Assume it's empty if it contains date patterns or typical "new" indicators
            const likelyNew = /\/[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(pathLower) || 
                              /\\[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(pathLower) ||
                              pathLower.includes('new') ||
                              pathLower.includes('untitled') ||
                              /_(20[0-9]{2})$/.test(pathLower);
            
            // If path looks like it has our suggested structure (contains dates and underscores in pattern),
            // simulate valid structure after folder creation
            const hasStructure = displayData.folder_created && 
                               (pathLower.includes('_') || 
                                pathLower.includes('projects') ||
                                pathLower.includes('biome'));
            
            setFolderStatus({
              isValid: hasStructure,
              isEmpty: likelyNew
            });
            
            console.log('DEV: Simulated folder status:', { 
              isValid: hasStructure, 
              isEmpty: likelyNew 
            });
          } else {
            // In browser production mode, just assume it's empty to allow structure creation
            setFolderStatus({
              isValid: displayData.folder_created || false,
              isEmpty: true
            });
          }
        }
      } catch (err) {
        console.error('Error validating folder:', err);
        
        // Even if validation fails, in dev/browser mode we should default to allowing operations
        if (!isTauri && process.env.NODE_ENV === 'development') {
          setFolderStatus({ isValid: false, isEmpty: true });
        } else {
          setFolderStatus({ isValid: false, isEmpty: false });
        }
      }
    };

    validateFolder();
  }, [displayData?.project_path, displayData?.folder_created, isTauri, handleInputChange]);

  const handleBrowsePath = async () => {
    try {
      console.log('Browse button clicked, Tauri available:', isTauri);
      
      if (isTauri) {
        console.log('✅ Using Tauri native file dialog to select parent folder');
        try {
          const selectedParentPath = await selectDirectory();
          if (selectedParentPath) {
            console.log('Selected parent directory:', selectedParentPath);
            
            // Generate the suggested project folder name
            const suggestedProjectName = generateSuggestedPath();
            console.log('Suggested project folder name:', suggestedProjectName);
            
            // Create the full project path by combining parent + suggested name
            const isWindows = window.navigator.platform.toLowerCase().includes('win') || selectedParentPath.includes('\\');
            const separator = isWindows ? '\\' : '/';
            const fullProjectPath = `${selectedParentPath}${separator}${suggestedProjectName}`;
            
            console.log('Full project path will be:', fullProjectPath);
            
            // Set the project path (this will be the full path where the structure will be created)
            handleInputChange('project_path', fullProjectPath);
            
            // Show confirmation to user
            const message = `Parent folder selected: ${selectedParentPath}\n\nProject folder will be created as:\n${suggestedProjectName}\n\nFull path: ${fullProjectPath}`;
            alert(message);
          }
        } catch (tauriError) {
          console.error('Tauri dialog error:', tauriError);
          alert(`Error selecting directory: ${tauriError.message || 'Unknown error'}`);
        }
      } else {
        console.warn('❌ Not running in Tauri environment - using browser fallback');
        
        // Generate suggested project name for the prompt
        const suggestedProjectName = generateSuggestedPath();
        
        // Browser fallback - prompt for parent folder path
        const message = `Since you're using the web version, please enter the PARENT folder path where you want to create your project.\n\nYour project folder will be created as: ${suggestedProjectName}\n\nExample parent path: C:\\Users\\YourName\\Documents\n\nEnter parent folder path:`;
        
        const parentPath = window.prompt(message, 'C:\\Users\\Documents');
        if (parentPath !== null && parentPath.trim() !== '') {
          console.log('Manually entered parent path:', parentPath);
          // Remove any extra quotes that might be added when pasting paths
          const cleanParentPath = parentPath.replace(/["']/g, '').trim();
          
          // Create full project path
          const isWindows = cleanParentPath.includes('\\') || cleanParentPath.includes('C:');
          const separator = isWindows ? '\\' : '/';
          const fullProjectPath = `${cleanParentPath}${separator}${suggestedProjectName}`;
          
          console.log('Full project path will be:', fullProjectPath);
          handleInputChange('project_path', fullProjectPath);
          
          // In development mode, simulate validation after a short delay
          if (process.env.NODE_ENV === 'development') {
            setTimeout(() => {
              console.log('Simulating folder validation...');
              setFolderStatus({ isValid: false, isEmpty: true });
            }, 500);
          }
          
          // Show confirmation
          alert(`Parent folder: ${cleanParentPath}\nProject folder will be: ${suggestedProjectName}\nFull path: ${fullProjectPath}`);
        }
      }
    } catch (err) {
      console.error('Failed to set project path:', err);
      alert('An error occurred while trying to set the project path. Please try again.');
    }
  };

  const handleCreateFolderStructure = async () => {
    // Step 1: Check if project is saved first
    if (!isProjectSaved()) {
      alert('⚠️ Please save the project first before creating the folder structure.\n\n' +
            'The system needs your project information to be permanently saved before it can create folders and generate documentation.\n\n' +
            'Please click "Save" to save your project details, then you can create the folder structure.');
      return;
    }

    // Step 2: Check if we have adequate project information
    if (!hasAdequateProjectInfo()) {
      alert('📝 Please provide complete project information before creating the folder structure:\n\n' +
            '• Project name (not just "New Project")\n' +
            '• Project description\n' +
            '• Analysis software to be used\n\n' +
            'This ensures the folder structure and README contain accurate information.');
      return;
    }

    // Step 3: Check if project folder is selected
    if (!displayData.project_path) {
      alert('📁 Please select a project folder first by clicking the "Browse" button.\n\n' +
            'You need to choose where on your computer the bioimage analysis project folders should be created.');
      return;
    }

    // Step 4: Check if there's already a valid project structure
    if (folderStatus.isValid && !displayData.folder_created) {
      if (!window.confirm('⚠️ This location already contains a valid BIOME project structure.\n\n' +
                         'Creating a new structure may overwrite existing files.\n\n' +
                         'Do you want to continue?')) {
        return;
      }
    }

    // Step 5: In production, warn about non-empty folders (but allow with confirmation)
    if (!folderStatus.isEmpty && process.env.NODE_ENV !== 'development' && isTauri) {
      if (!window.confirm('⚠️ The selected folder is not empty.\n\n' +
                         'Creating the project structure may affect existing files.\n\n' +
                         'Do you want to continue?')) {
        return;
      }
    }
    
    try {
      console.log('Create folder structure requested, Tauri available:', isTauri);
      
      if (isTauri) {
        console.log('✅ Creating folder structure at:', displayData.project_path);
        
        try {
          const result = await createProjectStructure(
            displayData.project_path,
            displayData.name || 'Untitled Project',
            displayData.description || 'No description provided'
          );
          
          console.log('Folder structure created successfully');
          
          // Update the project data to reflect that the folder has been created
          const projectToUpdate = {
            ...localEditingData,
            folder_created: true,
            readme_last_updated: result
          };
          
          setLocalEditingData(projectToUpdate);
          
          // If this is a new project that hasn't been saved yet, save it now
          if (!isProjectSaved()) {
            console.log('Auto-saving project after folder creation...');
            try {
              const savedProject = await projectService.create(projectToUpdate);
              console.log('Project auto-saved after folder creation');
              onProjectUpdate();
              // Update the selected project to the saved one
              onProjectSelect(savedProject, false);
            } catch (saveError) {
              console.error('Failed to auto-save project:', saveError);
              alert('Folder structure created successfully, but failed to save project. Please save manually.');
            }
          } else {
            // Update existing project
            await projectService.update(project.id, {
              folder_created: true,
              readme_last_updated: result
            });
            
            onProjectUpdate();
          }
          
          // Revalidate the folder after creation
          try {
            const validation = await validateProjectStructure(displayData.project_path, true);
            setFolderStatus({
              isValid: validation.has_valid_structure,
              isEmpty: validation.is_empty
            });
          } catch (validationError) {
            console.log('Validation failed after folder creation, but continuing...');
          }
          
          alert('Project folder structure created successfully!');
        } catch (createError) {
          console.error('Failed to create folder structure:', createError);
          alert('Failed to create folder structure: ' + (createError.message || 'Unknown error'));
        }
      } else {
        console.warn('❌ Not running in Tauri environment - opening web options');
        
        // Generate structure content for download
        const structureContent = createDownloadableStructure(
          displayData.name || 'Untitled Project', 
          displayData.description || 'No description provided'
        );
        setGeneratedStructureContent(structureContent);
        
        // Show the web folder structure modal instead of an alert
        setShowWebFolderModal(true);
        
        // For development purposes, allow simulation
        if (process.env.NODE_ENV === 'development' && !isTauri) {
          console.log('[DEV] Web mode structure generation');
          
          if (window.confirm('DEV MODE: Simulate successful download and folder creation?')) {
            handleWebFolderCreation();
          }
        }
      }
    } catch (err) {
      console.error('Failed to create folder structure:', err);
      alert('An error occurred while trying to create the folder structure. Please try again.');
    }
  };

  const handleUpdateReadme = async () => {
    // Check if project is saved first
    if (!isProjectSaved()) {
      alert('Please save the project first before updating the README. This ensures the README contains the most current project information.');
      return;
    }

    if (!displayData.project_path) {
      alert('Please select a project folder first');
      return;
    }

    if (!folderStatus.isValid) {
      alert('The selected folder must have a valid project structure');
      return;
    }
    
    try {
      console.log('Update README requested, Tauri available:', isTauri);
      
      if (isTauri) {
        console.log('✅ Updating README for project at:', displayData.project_path);
        
        // First scan the project folder to ensure it exists and has content
        const scanResult = await scanProjectFolder(displayData.project_path);
        console.log('Project folder scan result:', scanResult);
        
        // Ask for confirmation if a readme already exists
        try {
          const result = await updateReadme(
            displayData.project_path,
            displayData.name || 'Untitled Project',
            displayData.description || 'No description provided',
            localJournalEntries
          );
          
          console.log('README updated successfully');
          
          // Update the project to reflect that the README has been updated
          if (isEditing) {
            setLocalEditingData(prev => ({
              ...prev,
              readme_last_updated: result
            }));
          } else {
            await projectService.update(project.id, {
              readme_last_updated: result
            });
            
            const freshProject = await projectService.getById(project.id);
            onProjectSelect(freshProject);
            onProjectUpdate();
          }
          
          alert('README.txt has been updated successfully');
        } catch (tauriError) {
          console.error('Error updating README:', tauriError);
          alert(`Failed to update README: ${tauriError.toString()}`);
        }
      } else {
        console.warn('❌ Not running in Tauri environment - cannot update README');
        
        // Use a more helpful message with the modal system
        if (window.confirm(
          'README Update - Web Version Limitations\n\n' +
          'The README update feature requires direct file system access, which is only available in the desktop application.\n\n' +
          'Would you like to download a template README file based on your project information instead?'
        )) {
          // If user confirms, generate and download a README template using our API adapter
          await downloadReadmeTemplate(
            displayData.name || 'Untitled Project',
            displayData.description || 'No description provided',
            localJournalEntries,
            displayData.status,
            displayData.software,
            displayData.output_type
          );
          
          // Update the readme timestamp anyway for better UX
          const mockTimestamp = new Date().toISOString();
          
          if (isEditing) {
            setLocalEditingData(prev => ({
              ...prev,
              readme_last_updated: mockTimestamp
            }));
          } else {
            await projectService.update(project.id, {
              readme_last_updated: mockTimestamp
            });
            
            const freshProject = await projectService.getById(project.id);
            onProjectSelect(freshProject);
            onProjectUpdate();
          }
        }
        
        // Development mode simulation
        if (process.env.NODE_ENV === 'development' && !isTauri && window.confirm('DEV MODE: Simulate successful README update?')) {
          console.log('[DEV] Simulating successful README update');
          
          const mockTimestamp = new Date().toISOString();
          
          if (isEditing) {
            setLocalEditingData(prev => ({
              ...prev,
              readme_last_updated: mockTimestamp
            }));
          } else {
            await projectService.update(project.id, {
              readme_last_updated: mockTimestamp
            });
            
            const freshProject = await projectService.getById(project.id);
            onProjectSelect(freshProject);
            onProjectUpdate();
          }
          
          alert('[DEV MODE] Simulated README update successfully');
        }
      }
    } catch (err) {
      console.error('Failed to update README:', err);
      alert('An error occurred while trying to update the README. Please try again.');
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await projectService.delete(project.id);
      setShowDeleteConfirm(false);
      onProjectUpdate();
      onProjectSelect(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleTimeSpentChange = (type, value) => {
    const hours = type === 'hours' ? parseInt(value) || 0 : Math.floor(localEditingData.time_spent_minutes / 60);
    const minutes = type === 'minutes' ? parseInt(value) || 0 : localEditingData.time_spent_minutes % 60;
    const totalMinutes = (hours * 60) + minutes;
    handleInputChange('time_spent_minutes', totalMinutes);
  };

  // View rendering functions used in JSX below
  // eslint-disable-next-line no-unused-vars
  const renderGroupField = () => {
    if (isEditing) {
      return (
        <select
          id="group-select"
          name="group-select"
          className="w-full px-3 py-2 bg-white/40 dark:bg-surface-darker/40 backdrop-filter backdrop-blur-sm rounded-md focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors text-sm text-gray-900 dark:text-gray-100"
          value={displayData.group_id || ''}
          onChange={(e) => handleGroupChange(e.target.value)}
          disabled={!isEditing}
        >
          <option value="">Select a group</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      );
    } else {
      // When not editing, show the group name directly if it exists
      return (
        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">
          {displayData.group_name || "No group assigned"}
        </div>
      );
    }
  };

  // eslint-disable-next-line no-unused-vars
  const renderUserField = () => {
    if (isEditing) {
      return (
        <select
          id="user-select"
          name="user-select"
          className="w-full px-3 py-2 bg-white/40 dark:bg-surface-darker/40 backdrop-filter backdrop-blur-sm rounded-md focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors text-sm text-gray-900 dark:text-gray-100"
          value={displayData.user_id || ''}
          onChange={(e) => handleInputChange('user_id', e.target.value)}
          disabled={!isEditing || !displayData.group_id}
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      );
    } else {
      // When not editing, show the user name directly if it exists
      return (
        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">
          {displayData.user_name || "No user assigned"}
        </div>
      );
    }
  };

  // eslint-disable-next-line no-unused-vars
  const renderSoftwareField = () => {
    if (isEditing) {
      return (
        <select
          id="software-select"
          name="software-select"
          className={`${inputBaseClasses} ${!isEditing && 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark'}`}
          value={displayData.software || ''}
          onChange={(e) => handleInputChange('software', e.target.value)}
          disabled={!isEditing}
        >
          <option value="">Select software</option>
          {[
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
          ].map(software => (
            <option key={software} value={software}>
              {software}
            </option>
          ))}
        </select>
      );
    } else {
      return (
        <div className="px-3 py-2 bg-surface dark:bg-surface-dark text-text dark:text-text-dark rounded-md">
          {displayData.software || "No software selected"}
        </div>
      );
    }
  };

  const renderProjectFolderActions = () => (
    <div className="flex flex-wrap gap-2 mt-3">
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button
            id="create-structure-button"
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center whitespace-nowrap ${
              isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri) ? 
              '' : 
              'opacity-50 cursor-not-allowed'
            }`}
            onClick={handleCreateFolderStructure}
            disabled={!isProjectSaved() || !hasAdequateProjectInfo() || !displayData.project_path || folderStatus.isValid}
            aria-label="Create bioimage analysis folder structure for this project"
            style={{
              background: (isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri)) ? 
                'linear-gradient(45deg, #00BFFF, #0080FF)' : 
                'rgba(156, 163, 175, 0.3)',
              borderColor: (isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri)) ? 
                'rgba(0, 191, 255, 0.3)' : 
                'rgba(156, 163, 175, 0.3)',
              color: (isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri)) ? 
                'white' : 
                'rgba(107, 114, 128, 0.7)',
              backdropFilter: 'blur(10px)',
              border: (isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri)) ? 
                '1px solid rgba(0, 191, 255, 0.3)' : 
                '1px solid rgba(156, 163, 175, 0.3)',
              boxShadow: (isProjectSaved() && hasAdequateProjectInfo() && displayData.project_path && !folderStatus.isValid && (folderStatus.isEmpty || process.env.NODE_ENV === 'development' || !isTauri)) ? 
                '0 2px 8px rgba(0, 191, 255, 0.2)' : 'none'
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {isTauri ? 'Create Bioimage Structure' : 'Get Bioimage Structure'}
              {!isTauri && (
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              )}
            </span>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Panel className="bg-gray-800/90 text-white text-sm px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
          {!isProjectSaved() ? 
            'Step 1: Please save the project first' :
            !hasAdequateProjectInfo() ? 
            'Step 2: Complete project information (name, description, software, group, user)' :
            !displayData.project_path ? 
            'Step 3: Select a parent folder where your project folder will be created' :
            folderStatus.isValid ?
            'Valid project structure already exists at this location' :
            !folderStatus.isEmpty && process.env.NODE_ENV !== 'development' && isTauri ? 
            'Selected folder must be empty' :
            isTauri ? 
            'Create bioimage analysis folder structure for this project' : 
            'Web version: Get bioimage folder structure template and instructions'}
        </Tooltip.Panel>
      </Tooltip>
      
      <Tooltip>
        <Tooltip.Trigger asChild>
          <button
            id="update-readme-button"
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center whitespace-nowrap ${
              isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created)) ? 
              '' : 
              'opacity-50 cursor-not-allowed'
            }`}
            onClick={handleUpdateReadme}
            disabled={!isProjectSaved() || !(folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))}
            aria-label="Update the readme file with current project details"
            style={{
              background: (isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))) ? 
                'linear-gradient(45deg, #00BFFF, #0080FF)' : 
                'rgba(156, 163, 175, 0.3)',
              borderColor: (isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))) ? 
                'rgba(0, 191, 255, 0.3)' : 
                'rgba(156, 163, 175, 0.3)',
              color: (isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))) ? 
                'white' : 
                'rgba(107, 114, 128, 0.7)',
              backdropFilter: 'blur(10px)',
              border: (isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))) ? 
                '1px solid rgba(0, 191, 255, 0.3)' : 
                '1px solid rgba(156, 163, 175, 0.3)',
              boxShadow: (isProjectSaved() && (folderStatus.isValid || (process.env.NODE_ENV === 'development' && displayData.folder_created))) ? 
                '0 2px 8px rgba(0, 191, 255, 0.2)' : 'none'
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Update README.txt
              {!isTauri && (
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              )}
            </span>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Panel className="bg-gray-800/90 text-white text-sm px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
          {!isProjectSaved() ? 
            'Please save the project first' :
            !displayData.project_path ? 
            'Please select a project folder first' :
            !folderStatus.isValid && !(process.env.NODE_ENV === 'development' && displayData.folder_created) ? 
            'Selected folder must have a valid project structure' :
            isTauri ? 
            'Update the readme file with current project details' :
            'Desktop app only: This feature requires direct file access'}
        </Tooltip.Panel>
      </Tooltip>
      
      <div className="ml-auto text-xs text-slate-500">
        {!displayData.project_path ? (
          <div>No project folder selected</div>
        ) : (
          <>
            <div>
              {folderStatus.isValid ? 
                '✓ Valid project structure' : 
                displayData.folder_created ? 
                  '⚠️ Project marked as created but structure not validated' :
                  '× No project structure created yet'}
            </div>
            <div>
              {displayData.readme_last_updated ? 
                `README last updated: ${new Date(displayData.readme_last_updated).toLocaleString()}` : 
                'README not yet generated'}
            </div>
            {!isTauri && (
              <div className="mt-1 text-blue-500">
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Web Version
                </span>
                <span className="ml-1">Some file features are limited</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Generate a suggested project path based on project data
  const generateSuggestedPath = useCallback((baseDir = null) => {
    // Format date as YYYY-MM-DD
    const today = new Date();
    const datePart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Extract data for path creation following the specified format: YYYY-MM-DD_group_user_SOFTWARE
    const softwareName = displayData?.software || 'Unknown-Software';
    const groupName = displayData?.group_name || 'Unknown-Group';
    const userName = displayData?.user_name || 'Unknown-User';
    
    // Clean up names to make them suitable for filenames (replace spaces with dashes, remove special chars)
    const cleanGroup = groupName.replace(/\s+/g, '-').replace(/[^\w\s-]/g, '');
    const cleanUser = userName.replace(/\s+/g, '-').replace(/[^\w\s-]/g, '');
    const cleanSoftware = softwareName.replace(/\s+/g, '-').replace(/[^\w\s-]/g, '');
    
    // Build folder name in the requested format: YYYY-MM-DD_group_user_SOFTWARE
    const folderName = `${datePart}_${cleanGroup}_${cleanUser}_${cleanSoftware}`;
    
    // If we have a base directory, join with the folder name
    if (baseDir) {
      // For Windows (desktop app), always use backslashes
      // For web, use forward slashes unless base path already contains backslashes
      const isWindows = window.navigator.platform.toLowerCase().includes('win') || baseDir.includes('\\');
      const separator = isWindows ? '\\' : '/';
      return `${baseDir}${separator}${folderName}`;
    }
    
    return folderName;
  }, [displayData]);

  // Generate project folder structure content for browser download
  const generateProjectStructure = (projectName, description) => {
    const date = new Date().toISOString().split('T')[0];
    
    // Create structure content with bioimage-specific folders and files
    const structure = {
      'README.txt': `PROJECT: ${projectName || 'Untitled Project'}\n` +
                   `DATE: ${date}\n` +
                   `DESCRIPTION: ${description || 'No description provided'}\n\n` +
                   `This bioimage analysis project folder structure was generated by BIOME (Bio Imaging Organization and Management Environment).\n\n` +
                   `PROJECT STRUCTURE:\n\n` +
                   `🎯 request/\n` +
                   `Contains the initial user request and supporting documentation\n` +
                   `- documents/: Project specifications, requirements, and communication\n` +
                   `- images/: Reference images from the initial request\n` +
                   `- notes/: Project planning and meeting notes\n\n` +
                   `🔬 sample_data/\n` +
                   `Contains the raw biological images provided for analysis\n` +
                   `- original/: Original unmodified images from the biological sample\n` +
                   `- test_subset/: Small subset of images for testing analysis pipelines\n\n` +
                   `⚙️ processed_data/\n` +
                   `Contains intermediate processing results\n` +
                   `- converted/: Format-converted images (e.g., TIFF to other formats)\n` +
                   `- preprocessed/: Images after initial processing (denoising, calibration)\n` +
                   `- intermediate/: Temporary analysis files and intermediate results\n\n` +
                   `📚 references/\n` +
                   `Contains scientific and technical documentation\n` +
                   `- articles/: Relevant scientific papers and literature\n` +
                   `- protocols/: Analysis protocols and methodology documentation\n` +
                   `- manuals/: Software manuals and technical guides\n\n` +
                   `💻 scripts/\n` +
                   `Contains all analysis code and automation scripts\n` +
                   `- Analysis pipelines and image processing scripts\n` +
                   `- Custom functions and utilities\n` +
                   `- Batch processing and automation code\n\n` +
                   `📊 results/\n` +
                   `Contains final outputs and deliverables\n` +
                   `- analysis_results/: Final quantitative results, measurements, and statistics\n` +
                   `- tutorials/: Step-by-step guides for reproducing the analysis\n` +
                   `- protocols/: Finalized analysis protocols for future use\n` +
                   `- examples/: Example outputs and sample results\n\n` +
                   `USAGE NOTES:\n` +
                   `1. Place your raw images in sample_data/original/\n` +
                   `2. Use sample_data/test_subset/ for pipeline development\n` +
                   `3. Save intermediate processing steps in processed_data/\n` +
                   `4. Document your methodology in references/protocols/\n` +
                   `5. Place final results and reports in results/analysis_results/\n`,
      'request/documents/README.txt': 'Project specifications, requirements, and communication files',
      'request/images/README.txt': 'Reference images from the initial request',
      'request/notes/README.txt': 'Project planning and meeting notes',
      'sample_data/original/README.txt': 'Original unmodified images from the biological sample',
      'sample_data/test_subset/README.txt': 'Small subset of images for testing analysis pipelines',
      'processed_data/converted/README.txt': 'Format-converted images (e.g., TIFF to other formats)',
      'processed_data/preprocessed/README.txt': 'Images after initial processing (denoising, calibration)',
      'processed_data/intermediate/README.txt': 'Temporary analysis files and intermediate results',
      'references/articles/README.txt': 'Relevant scientific papers and literature',
      'references/protocols/README.txt': 'Analysis protocols and methodology documentation',
      'references/manuals/README.txt': 'Software manuals and technical guides',
      'scripts/README.txt': 'Analysis pipelines, custom functions, and batch processing code',
      'results/analysis_results/README.txt': 'Final quantitative results, measurements, and statistics',
      'results/tutorials/README.txt': 'Step-by-step guides for reproducing the analysis',
      'results/protocols/README.txt': 'Finalized analysis protocols for future use',
      'results/examples/README.txt': 'Example outputs and sample results',
      'journal.md': `# Project Journal: ${projectName || 'Untitled Project'}\n\n` +
                   `## Overview\n` +
                   `${description || 'No description provided'}\n\n` +
                   `## Journal Entries\n\n` +
                   `### ${date} - Project Created\n` +
                   `Initial project structure created.\n\n`
    };
    
    return structure;
  };
  
  // Create downloadable ZIP file with folder structure
  const createDownloadableStructure = (projectName, description) => {
    try {
      // For simplicity without adding zip libraries, we'll generate a text file with instructions
      // In a full implementation, you would use JSZip or similar to create a real ZIP file
      
      const structure = generateProjectStructure(projectName, description);
      
      // Generate file content explaining the structure
      let content = `# BIOME Project Structure for "${projectName || 'Untitled Project'}"\n\n`;
      content += `Date: ${new Date().toISOString().split('T')[0]}\n`;
      content += `Description: ${description || 'No description provided'}\n\n`;
      content += `## Recommended Folder Structure\n\n`;
      
      Object.keys(structure).forEach(path => {
        content += `### ${path}\n`;
        // Only include first 50 characters of content for preview
        content += `\`\`\`\n${structure[path].substring(0, 100)}${structure[path].length > 100 ? '...' : ''}\n\`\`\`\n\n`;
      });
      
      // Add instructions for manual creation
      content += `## Instructions\n\n`;
      content += `1. Create a new folder for your project (suggested name: ${generateSuggestedPath()})\n`;
      content += `2. Inside this folder, create the following bioimage analysis structure:\n`;
      content += `   - request/ (for initial user requests and documentation)\n`;
      content += `     - documents/: Project specifications, requirements, and communication\n`;
      content += `     - images/: Reference images from the initial request\n`;
      content += `     - notes/: Project planning and meeting notes\n`;
      content += `   - sample_data/ (for raw biological images)\n`;
      content += `     - original/: Original unmodified images from the biological sample\n`;
      content += `     - test_subset/: Small subset of images for testing analysis pipelines\n`;
      content += `   - processed_data/ (for intermediate processing results)\n`;
      content += `     - converted/: Format-converted images\n`;
      content += `     - preprocessed/: Images after initial processing\n`;
      content += `     - intermediate/: Temporary analysis files and intermediate results\n`;
      content += `   - references/ (for scientific and technical documentation)\n`;
      content += `     - articles/: Relevant scientific papers and literature\n`;
      content += `     - protocols/: Analysis protocols and methodology documentation\n`;
      content += `     - manuals/: Software manuals and technical guides\n`;
      content += `   - scripts/ (for all analysis code and automation scripts)\n`;
      content += `   - results/ (for final outputs and deliverables)\n`;
      content += `     - analysis_results/: Final quantitative results, measurements, and statistics\n`;
      content += `     - tutorials/: Step-by-step guides for reproducing the analysis\n`;
      content += `     - protocols/: Finalized analysis protocols for future use\n`;
      content += `     - examples/: Example outputs and sample results\n`;
      content += `3. Create a README.txt file with your project information\n`;
      content += `4. Create a journal.md file for ongoing notes\n\n`;
      content += `When you have created this structure, return to BIOME and confirm that you've created the folder structure.\n`;
      
      return content;
    } catch (error) {
      console.error('Error creating downloadable structure:', error);
      return null;
    }
  };

  // Web folder structure modal component
  const WebFolderModal = ({ isOpen, onClose, projectName, description, onDownload, onConfirmCreation }) => {
    if (!isOpen) return null;
    
    const handleDownload = () => {
      onDownload();
    };
    
    const handleConfirmManualCreation = () => {
      onConfirmCreation();
      onClose();
    };
    
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Project Folder Structure - Web Version"
        size="lg"
      >
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 dark:bg-blue-900/30 dark:border-blue-400">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm leading-5 font-medium text-blue-800 dark:text-blue-300">
                  Web Application Notice
                </h3>
                <div className="mt-2 text-sm leading-5 text-blue-700 dark:text-blue-200">
                  <p>
                    You're using the BIOME web application. The folder structure creation feature works differently than in the desktop version:
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Options for Web Users</h3>
          
          <div className="space-y-4">
            <div className="rounded-xl p-4 hover:bg-white/80 dark:hover:bg-gray-800/70 cursor-pointer backdrop-filter backdrop-blur-sm transition-all duration-300">
              <h4 className="font-medium">Option 1: Download Structure Template</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Download a text file with instructions and folder structure details that you can use to set up your project locally.
              </p>
              <button 
                onClick={handleDownload}
                className="btn btn-primary"
              >
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Structure Template
                </span>
              </button>
            </div>
            
            <div className="rounded-xl p-4 hover:bg-white/80 dark:hover:bg-gray-800/70 cursor-pointer backdrop-filter backdrop-blur-sm transition-all duration-300">
              <h4 className="font-medium">Option 2: Manual Creation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Create the structure manually on your computer, then click below to mark the structure as created in BIOME.
              </p>
              <div className="text-sm bg-white/60 dark:bg-gray-800/50 p-3 rounded-lg mb-3 font-mono backdrop-filter backdrop-blur-sm">
                <div>📁 {generateSuggestedPath()}/</div>
                <div className="ml-4">📁 data/</div>
                <div className="ml-4">📁 analysis/</div>
                <div className="ml-4">📁 results/</div>
                <div className="ml-4">📁 docs/</div>
                <div className="ml-4">📄 README.txt</div>
                <div className="ml-4">📄 journal.md</div>
              </div>
              <button 
                onClick={handleConfirmManualCreation}
                className="btn btn-secondary"
              >
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  I've Created the Structure Manually
                </span>
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <p>
                <strong>Note:</strong> For full filesystem integration capabilities, please consider using the BIOME desktop application.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Handle folder template download for web users
  const downloadFolderTemplate = () => {
    try {
      if (!generatedStructureContent) {
        const content = createDownloadableStructure(
          displayData.name || 'Untitled Project',
          displayData.description || 'No description provided'
        );
        setGeneratedStructureContent(content);
        
        if (!content) {
          alert('Error generating structure template');
          return;
        }
        
        // Use this content
        createDownloadLink(content);
      } else {
        // Use existing content
        createDownloadLink(generatedStructureContent);
      }
    } catch (error) {
      console.error('Error downloading structure template:', error);
      alert('Failed to generate downloadable structure template');
    }
  };
  
  // Create and trigger download link
  const createDownloadLink = (content) => {
    // Create a blob from the content
    const blob = new Blob([content], { type: 'text/markdown' });
    
    // Create safe filename based on project name
    const projectNameSafe = (displayData.name || 'Untitled-Project')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_');
    const filename = `BIOME_Structure_${projectNameSafe}_${new Date().toISOString().split('T')[0]}.md`;
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // Append to document, trigger click, and clean up
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Handle confirmation of manual folder creation for web users
  const handleWebFolderCreation = async () => {
    try {
      console.log('Web user confirmed manual folder creation');
      const mockTimestamp = new Date().toISOString();
      
      // Update the project data
      if (isEditing) {
        setLocalEditingData(prev => ({
          ...prev,
          folder_created: true,
          readme_last_updated: mockTimestamp
        }));
      } else {
        // Save changes directly if not in edit mode
        await projectService.update(project.id, {
          folder_created: true,
          readme_last_updated: mockTimestamp
        });
        
        // Refresh project data
        const freshProject = await projectService.getById(project.id);
        onProjectSelect(freshProject);
        onProjectUpdate();
      }
      
      // Update folder status
      setFolderStatus({
        isValid: true,
        isEmpty: false
      });
      
      // Close the modal and show success message
      setShowWebFolderModal(false);
      alert('Project structure has been marked as created. You can now use the "Update README" feature to keep your project documentation in sync.');
    } catch (error) {
      console.error('Error handling web folder creation:', error);
      alert('Failed to update project status. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-night-800 rounded-xl shadow-lg backdrop-filter backdrop-blur-xl h-full flex flex-col">
      {/* Web folder structure modal */}
      <WebFolderModal 
        isOpen={showWebFolderModal}
        onClose={() => setShowWebFolderModal(false)}
        projectName={displayData?.name || 'Untitled Project'}
        description={displayData?.description || 'No description provided'}
        onDownload={downloadFolderTemplate}
        onConfirmCreation={handleWebFolderCreation}
      />
      
      {/* Path fallback modal for web environment */}
      {isPathFallbackOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-night-800 p-6 rounded-lg w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Project Path</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Since you're using the web version, please select one of these suggested paths or enter your own:</p>
            
            <div className="space-y-2 mb-4">
              {suggestedPaths.map((path, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/70 cursor-pointer transition-all duration-300 backdrop-filter backdrop-blur-sm"
                  onClick={() => {
                    handleInputChange('project_path', path);
                    setIsPathFallbackOpen(false);
                  }}
                >
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{path}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-white/60 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/70 transition-all duration-300 backdrop-filter backdrop-blur-sm"
                onClick={() => setIsPathFallbackOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`flex-1 ${showScroll ? 'overflow-y-auto' : ''}`}>
        {/* Header with edit/save controls */}
        <div className="p-6 pb-2 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isEditing ? 'Edit Project' : (displayData?.name || 'Untitled Project')}
            </h3>
            {/* Meta line: last updated • created */}
            {!isEditing && (
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                {(() => {
                  const updatedRaw = project?.last_updated || project?.updatedAt;
                  const createdRaw = project?.creation_date || project?.createdAt;
                  const safeFormat = (ts) => {
                    if (!ts) return null;
                    try {
                      const d = new Date(ts);
                      if (isNaN(d.getTime())) return null;
                      return d.toLocaleString();
                    } catch {
                      return null;
                    }
                  };
                  const updated = safeFormat(updatedRaw);
                  const created = safeFormat(createdRaw);
                  if (!updated && !created) return null;
                  if (updated && created) return `Last updated ${updated} • Created ${created}`;
                  if (updated) return `Last updated ${updated}`;
                  return `Created ${created}`;
                })()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="transition-all duration-200 px-3 py-2 rounded-xl text-sm font-medium flex items-center whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(45deg, #00BFFF, #0080FF)',
                    borderColor: 'rgba(0, 191, 255, 0.3)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 191, 255, 0.2)'
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="transition-all duration-200 px-3 py-2 rounded-xl text-sm font-medium flex items-center whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(45deg, #8B5CF6, #6366F1)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEditing}
                  className="transition-all duration-200 px-3 py-2 rounded-xl text-sm font-medium flex items-center whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(45deg, #00BFFF, #0080FF)',
                    borderColor: 'rgba(0, 191, 255, 0.3)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 191, 255, 0.2)'
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Project
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-icon btn-sm text-red-600 hover:text-red-800 transition-colors hover:scale-[1.02]"
                  aria-label="Delete project"
                  title="Delete project"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
  </div>

        {/* Removed legacy Project Setup Status indicator - handled by the creation wizard now */}

        <div className={`flex-1 p-6 space-y-6 ${showScroll ? 'overflow-y-auto' : ''}`}>
          {/* Section 1: Project Information */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Project Information
            </h4>
            <div className="bg-white/70 dark:bg-gray-800/60 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-visible"
                 style={{ isolation: 'auto' }}>
              <table className="w-full">
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {/* Project Name - Only in edit mode */}
                  {isEditing && (
                    <tr>
                      <td className="px-4 py-3 w-1/4">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Project Name</div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={localEditingData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={inputBaseClasses}
                          placeholder="Project name"
                        />
                      </td>
                    </tr>
                  )}

                  {/* Status */}
                  <tr>
                    <td className="px-4 py-3 w-1/4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          id="status"
                          value={localEditingData?.status || "Preparing"}
                          onChange={(e) => handleInputChange("status", e.target.value)}
                          className={inputBaseClasses}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className={getStatusColor(project.status)}
                        >
                          {mapStatusName(project.status)}
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Group */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Group</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          id="group-select"
                          name="group-select"
                          className={inputBaseClasses}
                          value={displayData.group_id || ''}
                          onChange={(e) => handleGroupChange(e.target.value)}
                        >
                          <option value="">Select a group</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">{project.group_name || 'No group assigned'}</div>
                      )}
                    </td>
                  </tr>
                  
                  {/* User */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">User</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          id="user-select"
                          name="user-select"
                          className={inputBaseClasses}
                          value={displayData.user_id || ''}
                          onChange={(e) => handleInputChange('user_id', e.target.value)}
                          disabled={!displayData.group_id}
                        >
                          <option value="">Select a user</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">{project.user_name || 'No user assigned'}</div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Software */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Software</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          id="software-select"
                          name="software-select"
                          className={inputBaseClasses}
                          value={displayData.software || ''}
                          onChange={(e) => handleInputChange('software', e.target.value)}
                        >
                          <option value="">Select software</option>
                          {[
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
                          ].map(software => (
                            <option key={software} value={software}>
                              {software}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">{project.software || 'No software selected'}</div>
                      )}
                    </td>
                  </tr>

                  {/* Output / Result Type */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Output / Result Type</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          id="output-type-select"
                          name="output-type-select"
                          className={inputBaseClasses}
                          value={displayData.output_type || ''}
                          onChange={(e) => handleInputChange('output_type', e.target.value)}
                        >
                          <option value="">Select output type</option>
                          {PREDEFINED_OUTPUT_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-sm">
                          <span className="px-3 py-1 inline-flex items-center rounded-full text-xs font-medium bg-blue-50 dark:bg-bioluminescent-900/30 text-blue-700 dark:text-bioluminescent-300 border border-blue-200 dark:border-bioluminescent-800">
                            {project.output_type || '—'}
                          </span>
                          {project.output_type && (
                            <Tooltip>
                              <Tooltip.Trigger asChild>
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 dark:bg-night-700/40 text-gray-700 dark:text-night-200 border border-gray-200 dark:border-night-600"
                                  role="img"
                                  aria-label={`Output type: ${project.output_type}`}
                                  title={project.output_type}
                                >
                                  {renderOutputTypeIcon(project.output_type)}
                                </span>
                              </Tooltip.Trigger>
                              <Tooltip.Panel className="bg-surface text-text text-xs px-2 py-1 rounded shadow-lg">
                                {project.output_type}
                              </Tooltip.Panel>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Image Types */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Imaging Techniques</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <MultiSelectField
                          options={PREDEFINED_OPTIONS.imagingTechniques}
                          value={displayData.image_types || ''}
                          onChange={(value) => handleInputChange('image_types', value)}
                          placeholder="Select imaging techniques..."
                          fieldName="image_types"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">
                          {project.image_types ? (() => {
                            try {
                              const selections = Array.isArray(project.image_types) 
                                ? project.image_types 
                                : JSON.parse(project.image_types);
                              return selections.join(', ');
                            } catch {
                              return project.image_types;
                            }
                          })() : 'Not specified'}
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Sample Type */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Sample Type</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <MultiSelectField
                          options={PREDEFINED_OPTIONS.sampleTypes}
                          value={displayData.sample_type || ''}
                          onChange={(value) => handleInputChange('sample_type', value)}
                          placeholder="Select sample types..."
                          fieldName="sample_type"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">
                          {project.sample_type ? (() => {
                            try {
                              const selections = Array.isArray(project.sample_type) 
                                ? project.sample_type 
                                : JSON.parse(project.sample_type);
                              return selections.join(', ');
                            } catch {
                              return project.sample_type;
                            }
                          })() : 'Not specified'}
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Objective Magnification */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Objective Magnification</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={displayData.objective_magnification || ''}
                          onChange={(e) => handleInputChange('objective_magnification', e.target.value)}
                          className={inputBaseClasses}
                          placeholder="e.g. 63x oil immersion, 40x water immersion, 20x air"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">{project.objective_magnification || 'Not specified'}</div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Analysis Goal */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Analysis Goal</div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <MultiSelectField
                          options={PREDEFINED_OPTIONS.analysisGoals}
                          value={displayData.analysis_goal || ''}
                          onChange={(value) => handleInputChange('analysis_goal', value)}
                          placeholder="Select analysis goals..."
                          fieldName="analysis_goal"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm">
                          {project.analysis_goal ? (() => {
                            try {
                              const selections = Array.isArray(project.analysis_goal) 
                                ? project.analysis_goal 
                                : JSON.parse(project.analysis_goal);
                              return selections.join(', ');
                            } catch {
                              return project.analysis_goal;
                            }
                          })() : 'Not specified'}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Project Folder Management */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Project Folder & Structure
              {!hasAdequateProjectInfo() && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-normal bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                  Complete project info required
                </span>
              )}
            </h4>
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl mb-3 shadow-sm hover:shadow-lg transition-all duration-300">
              {isEditing ? (
                <div className="p-4 flex gap-2">
                  <input
                    type="text"
                    id="project-path"
                    value={localEditingData.project_path || ''}
                    onChange={(e) => handleInputChange('project_path', e.target.value)}
                    className={inputBaseClasses}
                    placeholder="Select project folder..."
                    readOnly
                  />
                  <button
                    onClick={handleBrowsePath}
                    disabled={isNewProject && !isProjectSaved()}
                    className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium flex items-center gap-2 ${
                      isNewProject && !isProjectSaved() 
                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                        : 'text-white hover:opacity-80'
                    }`}
                    style={{
                      background: isNewProject && !isProjectSaved() 
                        ? 'rgba(156, 163, 175, 0.3)'
                        : 'linear-gradient(45deg, #00BFFF, #0080FF)'
                    }}
                    title={isNewProject && !isProjectSaved() 
                      ? 'Please save the project first before selecting parent folder'
                      : 'Select parent folder where your project folder will be created\n\nYour project folder will be automatically named:\n' + (hasAdequateProjectInfo() ? generateSuggestedPath().split(/[\\//]/).pop() : 'YYYY-MM-DD_Group_User_Software')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Select Parent Folder
                  </button>
                </div>
              ) : project.project_path ? (
                <div className="p-4">
                  <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm font-mono text-gray-900 dark:text-gray-100 backdrop-filter backdrop-blur-sm break-all">
                    {project.project_path}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="px-3 py-2 bg-white/60 dark:bg-gray-800/50 rounded-md text-sm text-gray-500 dark:text-gray-400 italic backdrop-filter backdrop-blur-sm">No project location set</div>
                </div>
              )}
            </div>
            {renderProjectFolderActions()}
          </div>

          {/* Section 3: Project Status & Time Tracking */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Project Status & Time Tracking
            </h4>
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Spent:</span>
                <span className={`text-sm ${getTimeSpentColor(isEditing ? (localEditingData.time_spent_minutes || 0) : project.time_spent_minutes)} dark:text-gray-300`}>
                  {formatTimeSpent(isEditing ? (localEditingData.time_spent_minutes || 0) : project.time_spent_minutes)} / {MAX_HOURS}h
                </span>
              </div>
              
              {isEditing ? (
                <>
                  {/* Time slider */}
                  <div className="mt-4">
                    <input 
                      type="range" 
                      min="0" 
                      max={MAX_HOURS * 60} 
                      value={localEditingData.time_spent_minutes || 0}
                      onChange={(e) => handleInputChange('time_spent_minutes', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/30 dark:bg-gray-700/50 rounded-lg appearance-none cursor-pointer accent-bioluminescent-500 backdrop-filter backdrop-blur-sm"
                      step="15"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>0h</span>
                      <span>{Math.floor(MAX_HOURS/4)}h</span>
                      <span>{Math.floor(MAX_HOURS/2)}h</span>
                      <span>{Math.floor(MAX_HOURS*3/4)}h</span>
                      <span>{MAX_HOURS}h</span>
                    </div>
                  </div>
                  
                  {/* Fine-tune buttons */}
                  <div className="flex justify-end gap-2 mt-3">
                    <button 
                      onClick={() => {
                        const newValue = Math.max(0, (localEditingData.time_spent_minutes || 0) - 15);
                        handleInputChange('time_spent_minutes', newValue);
                      }}
                      className="btn btn-sm btn-secondary px-2 py-1"
                      title="Decrease by 15 minutes"
                    >
                      -15m
                    </button>
                    <button 
                      onClick={() => {
                        const newValue = Math.max(0, (localEditingData.time_spent_minutes || 0) - 60);
                        handleInputChange('time_spent_minutes', newValue);
                      }}
                      className="btn btn-sm btn-secondary px-2 py-1"
                      title="Decrease by 1 hour"
                    >
                      -1h
                    </button>
                    <button 
                      onClick={() => {
                        const newValue = Math.min(MAX_HOURS * 60, (localEditingData.time_spent_minutes || 0) + 60);
                        handleInputChange('time_spent_minutes', newValue);
                      }}
                      className="btn btn-sm btn-secondary px-2 py-1"
                      title="Increase by 1 hour"
                    >
                      +1h
                    </button>
                    <button 
                      onClick={() => {
                        const newValue = Math.min(MAX_HOURS * 60, (localEditingData.time_spent_minutes || 0) + 15);
                        handleInputChange('time_spent_minutes', newValue);
                      }}
                      className="btn btn-sm btn-secondary px-2 py-1"
                      title="Increase by 15 minutes"
                    >
                      +15m
                    </button>
                  </div>
                </>
              ) : null}
              
              {/* Progress bar - same in both modes */}
              <div className="mt-4">
                <div className="h-2 bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-filter backdrop-blur-sm">
                  <div
                    className={`h-full transition-all duration-300 ${getTimeSpentBarColor(isEditing ? (localEditingData.time_spent_minutes || 0) : (project.time_spent_minutes || 0))}`}
                    style={{
                      width: `${Math.min((((isEditing ? (localEditingData.time_spent_minutes || 0) : (project.time_spent_minutes || 0)) / 60 / MAX_HOURS) * 100), 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Project Description */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Description
            </h4>
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
              {isEditing ? (
                <div className="p-4">
                  <textarea
                    id="description"
                    value={localEditingData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`${inputBaseClasses} min-h-[120px] resize-vertical`}
                    placeholder="Project description"
                  />
                </div>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4.5: Project Resources */}
          {!isEditing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12l8-8 8 8M12 4v12" />
                  </svg>
                  Resources
                </h4>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-md text-white text-sm font-medium cursor-pointer" style={{ background: 'linear-gradient(45deg, #00BFFF, #0080FF)'}}>
                    Upload Images
                    <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleUploadImages} disabled={uploading} />
                  </label>
                  <label className="px-3 py-2 rounded-md text-white text-sm font-medium cursor-pointer" style={{ background: 'linear-gradient(45deg, #6366F1, #8B5CF6)'}}>
                    Upload Docs
                    <input type="file" accept="application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" onChange={handleUploadDocs} disabled={uploading} />
                  </label>
                  <button onClick={handleUpdateReadmeResources} className="px-3 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'linear-gradient(45deg, #10B981, #059669)'}}>
                    Update README Resources
                  </button>
                </div>
              </div>

              {/* Images grid */}
              <div className="mb-4">
                <h5 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Reference Images</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {resources.filter(r => r.kind === 'image').map((r) => (
                    <div key={r.id} className="bg-white/70 dark:bg-gray-800/60 rounded-lg p-2 shadow-sm hover:shadow-md transition-all">
                      <div className="relative w-full pb-[75%] bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <img
                          src={`${getApiBase()}/projects/${project.id}/references/${r.id}/file`}
                          alt={r.original_name}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-700 dark:text-gray-200 break-all">{r.original_name}</div>
                      <div className="mt-1">
                        <input
                          type="text"
                          defaultValue={r.caption || ''}
                          className="w-full px-2 py-1 text-xs rounded bg-white/70 dark:bg-gray-800/60"
                          placeholder="Add caption..."
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (r.caption || '')) handleSaveCaption(r.id, val);
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 text-[11px] text-gray-500">
                        <span>{(r.size || 0) > 0 ? `${Math.round(r.size/1024)} KB` : ''}</span>
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteResource(r.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {resources.filter(r => r.kind === 'image').length === 0 && (
                    <div className="text-sm text-gray-500">No images yet.</div>
                  )}
                </div>
              </div>

              {/* Documents list */}
              <div className="mb-2">
                <h5 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Reference Documents</h5>
                <div className="bg-white/70 dark:bg-gray-800/60 rounded-xl shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="px-3 py-2">File</th>
                        <th className="px-3 py-2 w-1/3">Caption</th>
                        <th className="px-3 py-2 w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {resources.filter(r => r.kind !== 'image').map(r => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">
                            <a className="text-blue-600 hover:underline break-all" href={`${getApiBase()}/projects/${project.id}/references/${r.id}/file`} target="_blank" rel="noreferrer">
                              {r.original_name}
                            </a>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              defaultValue={r.caption || ''}
                              className="w-full px-2 py-1 text-sm rounded bg-white/70 dark:bg-gray-800/60"
                              placeholder="Add caption..."
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (r.caption || '')) handleSaveCaption(r.id, val);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button className="text-red-600 hover:text-red-800 text-sm" onClick={() => handleDeleteResource(r.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {resources.filter(r => r.kind !== 'image').length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-gray-500" colSpan="3">No documents yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Journal Entries - only shown in view mode */}
          {!isEditing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Journal Entries
                </h4>
                <button
                  onClick={handleAddJournalEntry}
                  className="px-4 py-2 rounded-md text-white hover:opacity-80 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                  disabled={!journalEntry.trim()}
                  style={{
                    background: journalEntry.trim() ? 'linear-gradient(45deg, #00BFFF, #0080FF)' : 'rgba(156, 163, 175, 0.5)',
                    opacity: journalEntry.trim() ? 1 : 0.6
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Entry
                </button>
              </div>
              
              <div className="mb-4">
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  className="w-full px-3 py-2 bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none transition-colors mb-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                  placeholder="Add a journal entry..."
                  rows={3}
                />
              </div>
              
              {/* Journal entries list */}
              <div className="bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-night-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider">Entry</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider w-1/4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border-dark">
                    {localJournalEntries.length > 0 ? (
                      localJournalEntries.map((entry, index) => (
                        <tr 
                          key={entry.id || index}
                          className="animate-fade-in hover:bg-gray-50 dark:hover:bg-night-700 transition-colors"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-text dark:text-text-dark whitespace-pre-wrap flex-1">{entry.entry_text}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-icon btn-xs text-blue-600 hover:text-blue-800"
                                  title="Edit entry"
                                  aria-label="Edit journal entry"
                                  onClick={() => openEditJournal(entry)}
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  className="btn btn-icon btn-xs text-red-600 hover:text-red-800"
                                  title="Delete entry"
                                  aria-label="Delete journal entry"
                                  onClick={() => openDeleteJournal(entry)}
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs text-text-muted">{new Date(entry.entry_date).toLocaleString()}</div>
                            {entry.edited_at && (
                              <div className="text-[11px] text-blue-600 dark:text-bioluminescent-400">edited 
                                {(() => {
                                  try {
                                    const d = new Date(entry.edited_at);
                                    if (!isNaN(d.getTime())) return ` · ${d.toLocaleString()}`;
                                  } catch {}
                                  return '';
                                })()}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-4 text-center text-text-muted">
                          No journal entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation - unified wizard style */}
      <WizardFormModal
        isOpen={showDeleteConfirm}
        title="Delete Project"
        inlineError={null}
        onClose={() => setShowDeleteConfirm(false)}
        onSubmit={(e) => { e.preventDefault(); confirmDelete(); }}
        submitLabel="Delete Project"
        loading={false}
      >
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <p className="font-medium mb-2">This action cannot be undone.</p>
          <p>Are you sure you want to delete project "{project?.name}"?</p>
        </div>
      </WizardFormModal>

      {/* Web Folder Structure Modal - for browser users */}
      <WebFolderModal
        isOpen={showWebFolderModal}
        onClose={() => setShowWebFolderModal(false)}
        projectName={project.name}
        description={project.description}
        onDownload={() => {
          // Generate and download the project structure content as a text file
          const content = createDownloadableStructure(project.name, project.description);
          if (content) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.replace(/[^\w\s-]/g, '')}_structure.txt`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          }
        }}
        onConfirmCreation={async () => {
          // Mark the project folder as created (for web users)
          try {
            await projectService.update(project.id, {
              folder_created: true,
              readme_last_updated: new Date().toISOString()
            });
            
            // Update local state to reflect the changes
            setLocalEditingData(prev => ({
              ...prev,
              folder_created: true,
              readme_last_updated: new Date().toISOString()
            }));
            
            // Refresh project data
            const freshProject = await projectService.getById(project.id);
            onProjectSelect(freshProject);
            onProjectUpdate();
            
            alert('Project folder structure marked as created');
          } catch (err) {
            console.error('Failed to update project folder status:', err);
            alert('Failed to update project folder status. Please try again.');
          }
        }}
      />

      {/* Edit Journal Entry Modal */}
      <WizardFormModal
        isOpen={showEditJournalModal}
        title="Edit Journal Entry"
        inlineError={null}
        onClose={() => { setShowEditJournalModal(false); setEditingJournalEntry(null); setEditingJournalText(''); }}
        onSubmit={handleSaveEditedJournal}
        submitLabel="Save Changes"
        loading={false}
      >
        <div className="space-y-3">
          <textarea
            className="w-full px-3 py-2 bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg rounded-xl focus:ring-2 focus:ring-bioluminescent-300 dark:focus:ring-bioluminescent-600 focus:border-transparent outline-none text-sm text-gray-900 dark:text-gray-100 shadow-sm"
            rows={6}
            value={editingJournalText}
            onChange={(e) => setEditingJournalText(e.target.value)}
            placeholder="Update the journal entry text"
          />
          {editingJournalEntry?.edited_at && (
            <div className="text-xs text-text-muted">Last edited: {new Date(editingJournalEntry.edited_at).toLocaleString()}</div>
          )}
          {/* Diff preview */}
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Diff preview</div>
            <div className="max-h-40 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md text-xs font-mono p-2 bg-white/60 dark:bg-gray-800/50">
              {computeLineDiff(editingJournalEntry?.entry_text || '', editingJournalText).map((d, i) => (
                <div key={i} className={
                  d.type === 'added' ? 'text-green-700 dark:text-green-400' :
                  d.type === 'removed' ? 'text-red-700 dark:text-red-400' :
                  d.type === 'changed' ? 'text-amber-700 dark:text-amber-400' :
                  'text-gray-700 dark:text-gray-300'
                }>
                  {d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : d.type === 'changed' ? '~ ' : '  '}
                  {d.type === 'removed' ? d.left : d.right}
                </div>
              ))}
            </div>
          </div>
        </div>
      </WizardFormModal>

      {/* Delete Journal Entry Modal */}
      <WizardFormModal
        isOpen={showDeleteJournalModal}
        title="Delete Journal Entry"
        inlineError={null}
        onClose={() => { setShowDeleteJournalModal(false); setDeletingJournalEntry(null); }}
        onSubmit={handleConfirmDeleteJournal}
        submitLabel="Delete Entry"
        loading={false}
      >
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <p className="mb-2">Are you sure you want to delete this journal entry?</p>
          <div className="p-2 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs whitespace-pre-wrap">
            {(deletingJournalEntry?.entry_text || '').slice(0, 300)}{(deletingJournalEntry?.entry_text || '').length > 300 ? '…' : ''}
          </div>
        </div>
      </WizardFormModal>
    </div>
  );
}

export default ProjectDetails;