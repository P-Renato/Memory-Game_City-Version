/// <reference types="cypress" />

describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('logs in successfully', () => {
    cy.intercept('POST', '/api/users/login').as('login');

    cy.get('[data-cy=login-open-btn]').click();

    cy.get('[data-cy=login-username]').type('testuser');
    cy.get('[data-cy=login-password]').type('password123');
    cy.get('[data-cy=login-submit]').click();

    cy.wait('@login').its('response.statusCode').should('eq', 200);

    cy.contains('Welcome').should('be.visible');
  });

  it('shows error with wrong credentials', () => {
    cy.intercept('POST', '/api/users/login').as('login');

    cy.get('[data-cy=login-open-btn]').click();

    cy.get('[data-cy=login-username]').type('wrongone');
    cy.get('[data-cy=login-password]').type('wrongpassword');
    cy.get('[data-cy=login-submit]').click();

    cy.wait('@login');

    cy.get('[data-cy=login-error]')
      .should('be.visible')
      .and('contain', 'Invalid');
  });
});
