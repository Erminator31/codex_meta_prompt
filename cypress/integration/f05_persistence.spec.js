describe("F-05: Persistenz via localStorage", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));
    });

    it("➔ Add → localStorage updaten sofort", () => {
        cy.get("#todo-input").type("Persistenz-Test");
        cy.get("#add-button").click();

        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks).to.have.length(1);
            expect(tasks[0].text).to.equal("Persistenz-Test");
        });
    });

    it("➔ Toggle Done → localStorage wird geupdatet", () => {
        // 1) Task hinzufügen
        cy.get("#todo-input").type("Persistenz-Test2");
        cy.get("#add-button").click();

        // 2) Task abhaken
        cy.get("#todo-list li input[type='checkbox']").check();
        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks[0].isDone).to.be.true;
            expect(tasks[0].doneAt).not.to.be.null;
        });
    });

    it("➔ Beim Reload werden Tasks aus localStorage gerendert", () => {
        // Pre-Seed: 2 offene, 1 erledigter Task
        const tasks = [
            {
                id: "open-1",
                text: "Vorhandener Offener",
                priority: "low",
                createdAt: new Date().toISOString(),
                doneAt: null,
                isDone: false,
                order: 0
            },
            {
                id: "open-2",
                text: "Noch ein Offener",
                priority: "medium",
                createdAt: new Date().toISOString(),
                doneAt: null,
                isDone: false,
                order: 1
            },
            {
                id: "done-1",
                text: "Vorhandener Erledigter",
                priority: "high",
                createdAt: new Date().toISOString(),
                doneAt: new Date().toISOString(),
                isDone: true,
                order: 2
            }
        ];
        cy.window().then(win => {
            win.localStorage.setItem("todoTasks", JSON.stringify(tasks));
        });

        // 1) App neu laden
        cy.visit("/");

        // 2) Offene View prüfen: zwei Tasks
        cy.get('a[href="#/"]').click();
        cy.get("#todo-list li span[aria-label='Tasktext']").should("have.length", 2);
        cy.get("#todo-list li span[aria-label='Tasktext']").then($els => {
            const texts = $els.map((i, el) => Cypress.$(el).text()).get();
            expect(texts).to.include.members(["Vorhandener Offener", "Noch ein Offener"]);
        });

        // 3) Erledigt-View prüfen: ein Task
        cy.get('a[href="#/done"]').click();
        cy.get('#done-list li')
            .should('have.length', 1)
            .first()
            .contains('Vorhandener Erledigter');

    });
});
