import { rest } from 'msw';

// Sample project data for tests
const projectsData = [
  {
    id: 1,
    name: 'Test Project 1',
    description: 'Description for test project 1',
    path: 'D:/Projects/Test1',
    groupId: 1,
    createdAt: '2023-05-10T12:00:00.000Z',
    status: 'active'
  },
  {
    id: 2,
    name: 'Test Project 2',
    description: 'Description for test project 2',
    path: 'D:/Projects/Test2',
    groupId: 2,
    createdAt: '2023-05-15T12:00:00.000Z',
    status: 'completed'
  }
];

export const projectHandlers = [
  // GET /api/projects - Get all projects
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(projectsData)
    );
  }),
  
  // GET /api/projects/:id - Get a specific project
  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    const project = projectsData.find(p => p.id === parseInt(id));
    
    if (project) {
      return res(
        ctx.status(200),
        ctx.json(project)
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Project not found' })
      );
    }
  }),
  
  // POST /api/projects - Create a new project
  rest.post('/api/projects', async (req, res, ctx) => {
    const newProject = await req.json();
    
    return res(
      ctx.status(201),
      ctx.json({
        ...newProject,
        id: Math.max(...projectsData.map(p => p.id)) + 1,
        createdAt: new Date().toISOString()
      })
    );
  }),
  
  // PUT /api/projects/:id - Update a project
  rest.put('/api/projects/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const updateData = await req.json();
    const projectIndex = projectsData.findIndex(p => p.id === parseInt(id));
    
    if (projectIndex !== -1) {
      return res(
        ctx.status(200),
        ctx.json({
          ...projectsData[projectIndex],
          ...updateData
        })
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Project not found' })
      );
    }
  }),
  
  // DELETE /api/projects/:id - Delete a project
  rest.delete('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    const projectIndex = projectsData.findIndex(p => p.id === parseInt(id));
    
    if (projectIndex !== -1) {
      return res(
        ctx.status(200),
        ctx.json({ message: 'Project deleted successfully' })
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Project not found' })
      );
    }
  })
];
