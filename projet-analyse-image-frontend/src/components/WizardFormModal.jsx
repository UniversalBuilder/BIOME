import React from 'react';
import ReactDOM from 'react-dom';

// Reusable wizard-style modal component for consistent look & feel
// Props:
// - isOpen: boolean
// - title: string
// - inlineError: string | null
// - onClose: () => void (also closes on overlay click)
// - onSubmit: (e) => void
// - submitLabel: string
// - cancelLabel?: string = 'Cancel'
// - loading?: boolean
// - disabled?: boolean (extra disable guard)
// - variant?: 'default' | 'danger'  — 'danger' styles the submit button red
// - className?: string for modal panel extra classes
// - children: form fields content
export default function WizardFormModal({
  isOpen,
  title,
  inlineError,
  onClose,
  onSubmit,
  submitLabel,
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  variant = 'default',
  className = '',
  children,
}) {
  if (!isOpen) return null;

  const submitBtnClass = variant === 'danger'
    ? 'px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors'
    : 'px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors';

  const titleClass = variant === 'danger'
    ? 'text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2'
    : 'text-lg font-semibold text-gray-900 dark:text-white mb-4';

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-white dark:bg-night-800 border border-gray-200 dark:border-night-600 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 ${className}`}>
        {title && (
          <h3 className={titleClass}>
            {variant === 'danger' && (
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            {title}
          </h3>
        )}
        {inlineError ? (
          <div className="mb-3 text-sm text-red-600">{inlineError}</div>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading || disabled}
              className={submitBtnClass}
            >
              {loading ? 'Working…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
