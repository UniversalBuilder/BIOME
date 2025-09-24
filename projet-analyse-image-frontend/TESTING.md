# BIOME Testing Guide

This document outlines the testing setup for the BIOME application.

## Testing Stack

- **Jest**: JavaScript testing framework
- **React Testing Library**: For component tests
- **MSW (Mock Service Worker)**: For API mocking
- **Cypress**: For end-to-end testing

## Test Types

### 1. Unit Tests

Located in `src/tests/unit/`. These tests focus on testing individual components and utility functions in isolation.

To run unit tests:
```bash
npm run test:unit
```

### 2. Integration Tests

Located in `src/tests/integration/`. These tests verify that multiple components or functions work together correctly.

To run integration tests:
```bash
npm run test:integration
```

### 3. End-to-End Tests

Located in `cypress/e2e/`. These tests simulate user flows through the entire application.

To run Cypress tests in headless mode:
```bash
npm run test:e2e
```

To open Cypress Test Runner:
```bash
npm run cypress:open
```

## Test Coverage

To generate a test coverage report:
```bash
npm run test:coverage
```

This will create a `coverage` directory with detailed reports.

## Testing Best Practices

1. **Component Tests**: Test component behavior, not implementation details
2. **Mocking**: Use MSW for API mocks instead of directly mocking fetch/axios
3. **Test IDs**: Use `data-testid` attributes for component selection
4. **Environment Testing**: Consider both web and desktop (Tauri) environments

## Mock Server

The mock server is configured in `src/tests/mocks/server.js` and uses handlers defined in the `src/tests/mocks/handlers/` directory.

## Setting Up New Tests

### Unit Test Example:

```javascript
import { render, screen } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API Mock Test Example:

```javascript
import { rest } from 'msw';
import { server } from '../../mocks/server';

test('handles API response', async () => {
  // Override default handler if needed
  server.use(
    rest.get('/api/endpoint', (req, res, ctx) => {
      return res(ctx.json({ custom: 'response' }));
    })
  );
  
  // Test component that uses this API
});
```
