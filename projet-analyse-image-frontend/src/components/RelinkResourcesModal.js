import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { resourceService } from '../services/api';
import { selectDirectory } from '../services/tauriApi';
import Environment from '../utils/environmentDetection';

const RelinkResourcesModal = ({ isOpen, onClose, projectId, onRelinkComplete }) => {
  const [step, setStep] = useState('validate'); // validate, search, results, processing
  const [validationResult, setValidationResult] = useState(null);
  const [searchPath, setSearchPath] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingLog, setProcessingLog] = useState([]);

  const isTauri = Environment.isTauri();

  const validateResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await resourceService.validate(projectId);
      setValidationResult(result);
      if (result.missingCount > 0) {
        setStep('search');
      } else {
        // If no missing resources, we can just show success or close
        // But let's show the result first
      }
    } catch (err) {
      setError('Failed to validate resources: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      setStep('validate');
      setValidationResult(null);
      setSearchPath('');
      setSearchResults([]);
      setError(null);
      setProcessingLog([]);
      validateResources();
    }
  }, [isOpen, projectId, validateResources]);

  const handleBrowse = async () => {
    if (isTauri) {
      try {
        const selected = await selectDirectory();
        if (selected) {
          setSearchPath(selected);
        }
      } catch (err) {
        console.error('Failed to select directory:', err);
      }
    } else {
      // Fallback for web/dev
      const path = window.prompt('Enter absolute path to search for missing files:');
      if (path) setSearchPath(path);
    }
  };

  const handleSearch = async () => {
    if (!searchPath) return;
    setLoading(true);
    setError(null);
    try {
      const result = await resourceService.search(projectId, searchPath);
      setSearchResults(result.matches || []);
      setStep('results');
    } catch (err) {
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRelink = async () => {
    setLoading(true);
    setStep('processing');
    setProcessingLog(['Starting relink process...']);
    
    try {
      // Prepare operations
      const operations = searchResults.map(match => ({
        resourceId: match.resourceId,
        foundPath: match.foundPath,
        action: 'copy' // Default to copy for safety
      }));

      const result = await resourceService.relink(projectId, operations);
      
      const log = result.results.map(r => {
        const match = searchResults.find(m => m.resourceId === r.resourceId);
        return r.success 
          ? `✅ Relinked: ${match?.resourceName}` 
          : `❌ Failed: ${match?.resourceName} - ${r.error}`;
      });
      
      setProcessingLog(prev => [...prev, ...log, 'Done.']);
      
      if (onRelinkComplete) onRelinkComplete();
      
    } catch (err) {
      setError('Relink failed: ' + err.message);
      setProcessingLog(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && step === 'validate') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking project resources...</p>
        </div>
      );
    }

    if (step === 'validate' && validationResult) {
      if (validationResult.missingCount === 0) {
        return (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All resources are valid</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              All {validationResult.totalResources} resources were found in the project folder.
            </p>
            <div className="mt-6">
              <button onClick={onClose} className="btn btn-primary">Close</button>
            </div>
          </div>
        );
      }
    }

    if (step === 'search' || (step === 'validate' && validationResult?.missingCount > 0)) {
      return (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Found {validationResult?.missingCount} missing resources out of {validationResult?.totalResources}.
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
            <ul className="text-sm space-y-1">
              {validationResult?.missingResources.map(r => (
                <li key={r.id} className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {r.filename}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search for missing files in:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchPath}
                onChange={(e) => setSearchPath(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                placeholder="Select a folder..."
              />
              <button onClick={handleBrowse} className="btn btn-secondary whitespace-nowrap">
                Browse...
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select a folder where the missing files might be located (e.g., original source folder).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button 
              onClick={handleSearch} 
              disabled={!searchPath || loading}
              className="btn btn-primary"
            >
              {loading ? 'Searching...' : 'Search Files'}
            </button>
          </div>
        </div>
      );
    }

    if (step === 'results') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Search Results</h3>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No matching files found in the selected folder.</p>
              <button onClick={() => setStep('search')} className="mt-4 btn btn-secondary btn-sm">
                Try another folder
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Found {searchResults.length} matches. These files will be copied to your project's reference folder.
              </p>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing File</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found Match</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((match, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{match.resourceName}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" title={match.foundPath}>
                          {match.foundPath}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setStep('search')} className="btn btn-ghost">Back</button>
                <button 
                  onClick={handleRelink} 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Relinking...' : `Relink ${searchResults.length} Files`}
                </button>
              </div>
            </>
          )}
        </div>
      );
    }

    if (step === 'processing') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Processing...</h3>
          
          <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-md h-60 overflow-y-auto">
            {processingLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {!loading && (
            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="btn btn-primary">Close</button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relink Missing Resources"
      size="lg"
    >
      <div className="p-4">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {renderContent()}
      </div>
    </Modal>
  );
};

export default RelinkResourcesModal;
