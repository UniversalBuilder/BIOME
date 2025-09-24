import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '../../components/Modal';

describe('Modal Component', () => {
  const mockOnClose = jest.fn();
  const modalTitle = 'Test Modal Title';
  const modalContent = 'This is the modal content';

  beforeEach(() => {
    // Reset mocks
    mockOnClose.mockReset();
    // Reset body style
    document.body.style.overflow = '';
  });

  test('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title={modalTitle}>
        {modalContent}
      </Modal>
    );
    
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(modalContent)).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  test('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title={modalTitle}>
        {modalContent}
      </Modal>
    );
    
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(modalContent)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('should call onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title={modalTitle}>
        {modalContent}
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should reset body overflow style when unmounted', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose} title={modalTitle}>
        {modalContent}
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    
    expect(document.body.style.overflow).toBe('unset');
  });
});
