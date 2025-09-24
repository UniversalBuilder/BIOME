/// <reference types="cypress" />

describe('BIOME Application', () => {
  beforeEach(() => {
    // Mock the API endpoints
    cy.intercept('GET', '/api/projects', { fixture: 'projects.json' }).as('getProjects');
    
    // Visit the home page
    cy.visit('/');
  });

  it('should display the application title', () => {
    cy.contains('BIOME').should('be.visible');
  });

  it('should navigate to dashboard when clicked', () => {
    cy.get('[data-testid=dashboard-link]').click();
    cy.url().should('include', '/dashboard');
  });
});
