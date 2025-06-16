describe("F-08: Inline-Edit", () => {
    beforeEach(() => {
        // App neu laden und leeres localStorage
        cy.visit("/");
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));

        // Seed: Ein offener Task mit id="edit-1"
        const task = {
            id: "edit-1",
            text: "Alter Text",
            priority: "medium",
            createdAt: new Date().toISOString(),
            doneAt: null,
            isDone: false,
            order: 0
        };
        cy.window().then(win => {
            win.localStorage.setItem("todoTasks", JSON.stringify([task]));
        });

        cy.visit("/");
    });

    it("➔ Doppelklick auf .text öffnet <input> mit Werten", () => {
        cy.get('li[data-id="edit-1"] span[aria-label="Tasktext"]').dblclick();
        cy.get('li[data-id="edit-1"] input[type="text"]')
            .should("exist")
            .and("have.value", "Alter Text");
    });

    it("➔ Enter speichert Text in localStorage & DOM", () => {
        cy.get('li[data-id="edit-1"] span[aria-label="Tasktext"]').dblclick();
        cy.get('li[data-id="edit-1"] input[type="text"]')
            .clear()
            .type("Neuer Text{enter}");

        // DOM: Neuer Text sichtbar
        cy.get('li[data-id="edit-1"] span[aria-label="Tasktext"]')
            .should("contain.text", "Neuer Text");

        // localStorage: geändert
        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks[0].text).to.equal("Neuer Text");
        });
    });

    it("➔ Esc bricht Edit ab, Text bleibt unverändert", () => {
        cy.get('li[data-id="edit-1"] span[aria-label="Tasktext"]').dblclick();
        cy.get('li[data-id="edit-1"] input[type="text"]')
            .clear()
            .type("Wrong Text{esc}");

        // DOM: Alter Text
        cy.get('li[data-id="edit-1"] span[aria-label="Tasktext"]')
            .should("contain.text", "Alter Text");

        // localStorage: kein Change
        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks[0].text).to.equal("Alter Text");
        });
    });
});
