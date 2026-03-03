import React, { useState, useEffect, useCallback } from 'react';
import metadataOptionsApi from '../services/metadataOptionsApi';

const TABS = [
  { key: 'software',            label: 'Software' },
  { key: 'imaging_techniques',  label: 'Imaging Techniques' },
  { key: 'sample_type',         label: 'Sample Type' },
  { key: 'analysis_goal',       label: 'Analysis Goal' },
];

// Map tab key → property name in the getAllOptions() response
const TAB_TO_PROP = {
  software:           'software',
  imaging_techniques: 'imagingTechniques',
  sample_type:        'sampleTypes',
  analysis_goal:      'analysisGoals',
};

export default function MetadataOptionsManager() {
  const [activeTab, setActiveTab]       = useState('software');
  const [options, setOptions]           = useState({ software: [], imagingTechniques: [], sampleTypes: [], analysisGoals: [] });
  const [isLoading, setIsLoading]       = useState(true);
  const [loadError, setLoadError]       = useState(null);

  // Add-option state
  const [newValue, setNewValue]         = useState('');
  const [isAdding, setIsAdding]         = useState(false);
  const [addError, setAddError]         = useState('');

  // Edit-option state
  const [editingId, setEditingId]       = useState(null);
  const [editValue, setEditValue]       = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError]       = useState('');

  // Delete state
  const [deletingId, setDeletingId]     = useState(null);
  const [deleteError, setDeleteError]   = useState('');
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const all = await metadataOptionsApi.getAllOptions();
      setOptions(all);
    } catch (err) {
      setLoadError('Failed to load options. Please refresh.');
      console.error('MetadataOptionsManager load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  // ─── current tab list ────────────────────────────────────────────────────
  const currentList = options[TAB_TO_PROP[activeTab]] || [];

  // ─── Add ─────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) { setAddError('Value cannot be empty.'); return; }
    setIsAdding(true);
    setAddError('');
    try {
      await metadataOptionsApi.createOption(activeTab, trimmed);
      setNewValue('');
      await loadOptions();
    } catch (err) {
      setAddError(err.message || 'Failed to add option.');
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────────
  const startEdit = (opt) => {
    setEditingId(opt.id);
    setEditValue(opt.value);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditError('');
  };

  const saveEdit = async (id) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditError('Value cannot be empty.'); return; }
    setIsSavingEdit(true);
    setEditError('');
    try {
      await metadataOptionsApi.updateOption(id, { value: trimmed });
      setEditingId(null);
      await loadOptions();
    } catch (err) {
      setEditError(err.message || 'Failed to update option.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────
  const requestDelete = (opt) => {
    setDeleteTarget(opt);
    setDeleteError('');
    setIsConfirmDelete(true);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteError('');
    setIsConfirmDelete(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError('');
    try {
      await metadataOptionsApi.deleteOption(deleteTarget.id);
      setIsConfirmDelete(false);
      setDeleteTarget(null);
      await loadOptions();
    } catch (err) {
      // API throws with .usageCount populated on 409
      const count = err.usageCount;
      if (count !== undefined) {
        setDeleteError(`Cannot delete: this option is used in ${count} project${count !== 1 ? 's' : ''}.`);
      } else {
        setDeleteError(err.message || 'Failed to delete option.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Tab switch ──────────────────────────────────────────────────────────
  const switchTab = (key) => {
    setActiveTab(key);
    setNewValue('');
    setAddError('');
    setEditingId(null);
    setEditError('');
    cancelDelete();
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-night-600 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-bioluminescent-600 dark:text-bioluminescent-400 border-b-2 border-bioluminescent-500 bg-bioluminescent-500/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-night-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading / error */}
      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Loading options…</div>
      )}
      {loadError && (
        <div className="text-sm text-red-500 py-4 text-center">{loadError}</div>
      )}

      {!isLoading && !loadError && (
        <>
          {/* Options list */}
          <ul className="space-y-2 mb-4">
            {currentList.length === 0 && (
              <li className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No options yet. Add one below.</li>
            )}
            {currentList.map(opt => (
              <li
                key={opt.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-night-700 border border-gray-200 dark:border-night-600 group"
              >
                {editingId === opt.id ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(opt.id); if (e.key === 'Escape') cancelEdit(); }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-night-800 border border-bioluminescent-400 rounded focus:outline-none text-gray-800 dark:text-gray-100"
                    />
                    <button
                      onClick={() => saveEdit(opt.id)}
                      disabled={isSavingEdit}
                      className="px-2 py-1 text-xs font-medium rounded bg-bioluminescent-500/20 text-bioluminescent-600 dark:text-bioluminescent-400 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-colors disabled:opacity-50"
                    >
                      {isSavingEdit ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 text-xs rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    {editError && <span className="text-xs text-red-500 ml-1">{editError}</span>}
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{opt.value}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(opt)}
                        className="px-2 py-1 text-xs rounded text-gray-500 dark:text-gray-400 hover:text-bioluminescent-600 dark:hover:text-bioluminescent-400 hover:bg-bioluminescent-500/10 transition-colors"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(opt)}
                        className="px-2 py-1 text-xs rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* Add new option */}
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={newValue}
                onChange={e => { setNewValue(e.target.value); setAddError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder={`Add a new ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} option…`}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-night-800 border border-gray-200 dark:border-night-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-bioluminescent-400 focus:border-bioluminescent-400"
              />
              {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
            </div>
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-bioluminescent-500/20 text-bioluminescent-600 dark:text-bioluminescent-400 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isAdding ? 'Adding…' : '+ Add'}
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {isConfirmDelete && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-night-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-night-600">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Option</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Delete <strong className="text-gray-900 dark:text-gray-100">"{deleteTarget.value}"</strong>?
              This cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-night-700 transition-colors"
              >
                Cancel
              </button>
              {!deleteError && (
                <button
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
                >
                  {deletingId !== null ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
