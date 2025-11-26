import React, { useState } from 'react';
import ImportProjectModal from './ImportProjectModal';
import { projectService } from '../services/api';

const ImportProjectButton = ({ onProjectImported, className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImport = async (projectData) => {
    try {
      const newProject = await projectService.create(projectData);
      if (onProjectImported) {
        onProjectImported(newProject);
      }
      
      // Show success toast
      if (window.toast) {
        window.toast(`Project imported: ${newProject.name}`, { type: 'success' });
      }
    } catch (error) {
      console.error('Failed to import project:', error);
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  return (
    <>
      <button
        className={className || "btn btn-secondary hover-soft"}
        onClick={() => setIsModalOpen(true)}
      >
        {children || (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Import Project
          </>
        )}
      </button>

      <ImportProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
};

export default ImportProjectButton;
