import { setupServer } from 'msw/node';
import { projectHandlers } from './handlers/projects';

// Create a server instance
export const server = setupServer(
  ...projectHandlers,
  // Add other API handlers here as needed
);
