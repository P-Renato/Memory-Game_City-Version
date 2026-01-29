/// <reference types="cypress" />

describe('Login Flow - SECURITY TESTS', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/');
    
    // Optional: Clear test users from database
    // cy.task('clearTestUsers');
  });

  describe('Authentication Security', () => {
    it('rejects login with invalid credentials', () => {
      cy.intercept('POST', '/api/users/login').as('login');
      
      cy.get('[data-cy=login-open-btn]').click();
      cy.get('[data-cy=login-username]').type('NONEXISTENT_USER_12345');
      cy.get('[data-cy=login-password]').type('wrongpass');
      cy.get('[data-cy=login-submit]').click();

      // Wait for response and check status
      cy.wait('@login').its('response.statusCode').should('eq', 401);
      
      // Check response body
      cy.get('@login').its('response.body').should((body) => {
        expect(body).to.have.property('success', false);
        expect(body.error).to.include('Invalid');
      });
      
      // Check frontend shows error
      cy.get('[data-cy=login-error]')
        .should('be.visible')
        .and('contain', 'Invalid');
    });

    it('rejects login with empty credentials', () => {
      cy.get('[data-cy=login-open-btn]').click();
      cy.get('[data-cy=login-submit]').click();
      
      // Check that form is still visible (submission prevented)
      cy.get('[data-cy=login-username]').should('be.visible');
      cy.get('[data-cy=login-password]').should('be.visible');
      
      // Optional: Check for HTML5 validation
      cy.get('[data-cy=login-username]').then(($input) => {
        if ($input[0].checkValidity && !$input[0].checkValidity()) {
          // HTML5 validation is working
          expect(true).to.be.true;
        } else {
          // Check for JS validation error
          cy.get('[data-cy=login-error]').should('be.visible');
        }
      });
    });
  });

  describe('Successful Login', () => {
    it('logs in with valid credentials', () => {
      // First, clean up any existing test user
      const testUsername = `test_${Date.now()}`;
      const testEmail = `${testUsername}@test.com`;
      const testPassword = 'Password123!';
      
      // Create a fresh test user
      cy.request({
        method: 'POST',
        url: 'http://localhost:3001/api/users/register',
        body: {
          username: testUsername,
          email: testEmail,
          password: testPassword
        },
        failOnStatusCode: false
      });
      
      // Now test login
      cy.intercept('POST', '/api/users/login').as('login');
      
      cy.get('[data-cy=login-open-btn]').click();
      cy.get('[data-cy=login-username]').type(testUsername);
      cy.get('[data-cy=login-password]').type(testPassword);
      cy.get('[data-cy=login-submit]').click();

      // Check backend response
      cy.wait('@login').its('response.statusCode').should('eq', 200);
      cy.get('@login').its('response.body.success').should('eq', true);
      
      // Close the modal first (it stays open after successful login)
      cy.get('body').then(($body) => {
        // Check if modal is still open
        if ($body.find('._modalOverlay_tcz30_207').length > 0) {
          // Click outside to close modal
          cy.get('._modalOverlay_tcz30_207').click(10, 10);
        }
      });
      
      // Now check UI updates
      cy.get('[data-cy=login-open-btn]').should('not.exist');
      
      // Check for welcome message (might be in a different element)
      cy.get('body').then(($body) => {
        // Look for any welcome text
        if ($body.text().includes('Welcome')) {
          cy.contains('Welcome').should('be.visible');
        } else if ($body.find('[data-cy=user-menu]').length > 0) {
          // Or check for user menu
          cy.get('[data-cy=user-menu]').should('be.visible');
        } else {
          // At minimum, login button should be gone
          cy.get('[data-cy=login-open-btn]').should('not.exist');
        }
      });
    });
  });
});