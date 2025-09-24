import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Basic Testing Setup', () => {
  test('basic test environment works', () => {
    render(<div>Test Component</div>);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  test('math still works', () => {
    expect(1 + 1).toBe(2);
  });
});
