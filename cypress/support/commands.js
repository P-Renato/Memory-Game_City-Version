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

// cypress/support/e2e.js or commands.js
beforeEach(() => {
  // Clear test data from database
  cy.task('clearTestUsers');
});

// cypress/plugins/index.js (if using) or cypress.config.ts
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async clearTestUsers() {
          // Connect to MongoDB and delete test users
          const { MongoClient } = require('mongodb');
          const client = new MongoClient('mongodb://localhost:27017');
          await client.connect();
          const db = client.db('your_database_name');
          await db.collection('users').deleteMany({
            $or: [
              { username: { $regex: /^test_/ } },
              { username: 'wronguser' },
              { email: { $regex: /@test\.com$/ } }
            ]
          });
          await client.close();
          return null;
        }
      });
    }
  }
};