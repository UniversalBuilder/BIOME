import React, { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            // Prevent scrolling of the background when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-filter backdrop-blur-xl rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-scale-in border border-gray-200/50 dark:border-border-dark/50 overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 dark:border-border-dark/50 flex justify-between items-center">
                    <div 
                        className="text-lg font-semibold"
                        style={{
                            background: 'linear-gradient(45deg, rgba(5, 213, 159, 0.85), rgba(20, 75, 123, 0.85))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;