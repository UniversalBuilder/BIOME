import React from 'react';

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
  className = '',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        )}
        {inlineError ? (
          <div className="mb-3 text-sm text-red-600">{inlineError}</div>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading || disabled}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl"
            >
              {loading ? 'Working…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
