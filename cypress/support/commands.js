// cypress/support/commands.js
// (kein "cypress-drag-drop"-Import mehr!)

Cypress.Commands.add("resetStorage", () => {
    cy.window().then(win => win.localStorage.removeItem("todoTasks"));
});

Cypress.Commands.add("seedTasks", tasks => {
    cy.window().then(win => win.localStorage.setItem("todoTasks", JSON.stringify(tasks)));
});
