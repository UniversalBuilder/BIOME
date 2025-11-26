import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { selectDirectory } from '../services/tauriApi';
import { groupService } from '../services/api';
import Environment from '../utils/environmentDetection';

const ImportProjectModal = ({ isOpen, onClose, onImport }) => {
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [userId, setUserId] = useState('');
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isTauri = Environment.isTauri();

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setPath('');
      setName('');
      setDescription('');
      setGroupId('');
      setUserId('');
      setError(null);
      
      // Load groups
      groupService.getAll()
        .then(setGroups)
        .catch(err => console.error('Failed to load groups:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (groupId) {
      groupService.getUsers(groupId)
        .then(setUsers)
        .catch(err => console.error('Failed to load users:', err));
    } else {
      setUsers([]);
    }
  }, [groupId]);

  const handleBrowse = async () => {
    try {
      if (isTauri) {
        const selected = await selectDirectory();
        if (selected) {
          setPath(selected);
          // Infer project name from folder name
          const folderName = selected.split(/[/\\]/).pop();
          setName(folderName);
        }
      } else {
        const input = window.prompt('Enter absolute path to project folder:');
        if (input) {
          setPath(input);
          const folderName = input.split(/[/\\]/).pop();
          setName(folderName);
        }
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
      setError('Failed to select directory');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!path || !name) {
      setError('Path and Name are required');
      return;
    }

    setLoading(true);
    try {
      await onImport({
        name,
        description,
        project_path: path,
        group_id: groupId,
        user_id: userId,
        folder_created: true, // Assume folder exists since we imported it
        status: 'Active' // Default status
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Existing Project"
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="Select a folder..."
            />
            <button
              type="button"
              onClick={handleBrowse}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Browse
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select the root folder of the existing project.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Project Name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Brief description of the project..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group (Optional)
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User (Optional)
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!groupId}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !path || !name}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import Project'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ImportProjectModal;
