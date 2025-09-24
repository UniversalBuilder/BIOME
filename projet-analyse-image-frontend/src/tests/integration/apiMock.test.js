import { rest } from 'msw';
import { server } from '../../mocks/server';

// This is a generic test to ensure our mock server is working
describe('MSW Server Setup', () => {
  test('handles GET request to /api/projects', async () => {
    // Make a fetch request to the mocked endpoint
    const response = await fetch('/api/projects');
    const data = await response.json();
    
    // Assert that the response is what we expect
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
  });
  
  test('handles GET request for single project', async () => {
    const response = await fetch('/api/projects/1');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('name', 'Test Project 1');
  });
  
  test('handles 404 for non-existent project', async () => {
    const response = await fetch('/api/projects/999');
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data).toHaveProperty('message', 'Project not found');
  });
  
  test('can override handler for specific test', async () => {
    // Override the handler for this specific test
    server.use(
      rest.get('/api/projects', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json([{ id: 999, name: 'Override Project' }])
        );
      })
    );
    
    const response = await fetch('/api/projects');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data[0]).toHaveProperty('id', 999);
    expect(data[0]).toHaveProperty('name', 'Override Project');
  });
});
