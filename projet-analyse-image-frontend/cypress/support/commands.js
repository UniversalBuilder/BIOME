// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to simulate login
Cypress.Commands.add('login', (username = 'testuser', password = 'password') => {
  cy.intercept('POST', '/api/users/login', {
    statusCode: 200,
    body: {
      id: 1,
      username,
      name: 'Test User',
      token: 'fake-jwt-token'
    }
  }).as('loginRequest');

  // Navigate to login page (adjust if needed)
  cy.visit('/login');

  // Fill login form
  cy.get('[data-testid=username-input]').type(username);
  cy.get('[data-testid=password-input]').type(password);
  cy.get('[data-testid=login-button]').click();

  // Wait for login request to complete
  cy.wait('@loginRequest');
  
  // Verify we're redirected to dashboard
  cy.url().should('include', '/dashboard');
  
  // Store token in localStorage as your app might do
  cy.window().then(win => {
    win.localStorage.setItem('auth_token', 'fake-jwt-token');
  });
});

// Command to simulate having projects loaded
Cypress.Commands.add('mockProjects', () => {
  cy.intercept('GET', '/api/projects', {
    statusCode: 200,
    body: [
      {
        id: 1,
        name: 'Test Project 1',
        description: 'E2E test project 1',
        path: 'D:/Projects/Test1',
        groupId: 1,
        createdAt: '2023-05-10T12:00:00.000Z',
        status: 'active'
      },
      {
        id: 2,
        name: 'Test Project 2',
        description: 'E2E test project 2',
        path: 'D:/Projects/Test2',
        groupId: 2,
        createdAt: '2023-05-15T12:00:00.000Z',
        status: 'completed'
      }
    ]
  }).as('getProjects');
});
