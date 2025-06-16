describe("F-02: Aufgabe abhaken (Toggle Done)", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));

        // Seed: Eine offene Aufgabe in localStorage erstellen
        const task = {
            id: "id-toggle-1",
            text: "Aufgabe zum Testen",
            priority: "medium",
            createdAt: new Date().toISOString(),
            doneAt: null,
            isDone: false,
            order: 0
        };
        cy.window().then(win => {
            win.localStorage.setItem("todoTasks", JSON.stringify([task]));
        });

        // Neu laden, damit die App render() aufruft
        cy.visit("/");
    });

    it("➔ Jede offene Aufgabe hat eine Checkbox", () => {
        cy.get("#todo-list li").should("have.length", 1);
        cy.get("#todo-list li input[type='checkbox']").should("have.length", 1);
    });

    it("➔ Beim Checken wird doneAt gesetzt und li verschwindet aus offenem View", () => {
        // checken
        cy.get("#todo-list li input[type='checkbox']").check();

        // da der Task nun erledigt ist, sollte #todo-list leer sein (offene View)
        cy.get("#todo-list li").should("have.length", 0);

        // localStorage prüfen: isDone = true und doneAt ist nicht null
        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks).to.have.length(1);
            expect(tasks[0].isDone).to.be.true;
            expect(tasks[0].doneAt).not.to.be.null;
        });
    });
});
