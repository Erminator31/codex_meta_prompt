describe("F-01: Aufgabe anlegen", () => {
    beforeEach(() => {
        // 1) App starten
        cy.visit("/");
        // 2) localStorage leeren
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));
    });

    it("➔ #add-button ist disabled, wenn #todo-input leer ist", () => {
        cy.get("#todo-input").should("have.value", "");
        cy.get("#add-button").should("be.disabled");
    });

    it("➔ #add-button wird aktiv, sobald Text eingegeben wird", () => {
        cy.get("#todo-input").type("Meine erste Aufgabe");
        cy.get("#add-button").should("not.be.disabled");
    });

    it("➔ Aufgabe erscheint in #todo-list und in localStorage", () => {
        const text = "Test-Task";
        cy.get("#todo-input").type(text);
        cy.get("#add-button").click();

        // Check: Existiert genau eine li in #todo-list mit diesem Text?
        cy.get("#todo-list li span[aria-label='Tasktext']")
            .should("have.length", 1)
            .and("contain.text", text);

        // Check: localStorage["todoTasks"] enthält genau 1 Element mit text="Test-Task" und isDone=false
        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks).to.have.length(1);
            expect(tasks[0].text).to.equal(text);
            expect(tasks[0].isDone).to.be.false;
            expect(tasks[0]).to.have.property("createdAt");
            expect(tasks[0].priority).to.equal("low"); // default selection
        });
    });

    it("➔ #todo-input akzeptiert maximal 200 Zeichen", () => {
        const longText = "a".repeat(250);
        cy.get("#todo-input").type(longText).invoke("val").should("have.length", 200);
    });
});