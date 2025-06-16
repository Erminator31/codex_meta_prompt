describe("F-06: Priorität & Badges", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));
    });

    it("➔ Beim Erstellen kann man Priorität wählen und es wird in localStorage gespeichert", () => {
        cy.get("#todo-input").type("Priority Test");
        cy.get("#priority-select").select("high"); // „🔥 Hoch“
        cy.get("#add-button").click();

        cy.window().then(win => {
            const tasks = JSON.parse(win.localStorage.getItem("todoTasks"));
            expect(tasks[0].priority).to.equal("high");
        });
    });

    it("➔ Aufgabenliste zeigt Badge.high für high-Priority", () => {
        // Seed: ein Task mit priority="high"
        const task = {
            id: "prio-1",
            text: "Check Priority",
            priority: "high",
            createdAt: new Date().toISOString(),
            doneAt: null,
            isDone: false,
            order: 0
        };
        cy.window().then(win => {
            win.localStorage.setItem("todoTasks", JSON.stringify([task]));
        });
        cy.visit("/");

        cy.get("#todo-list li .priority-badge.priority-high")
            .should("exist")
            .and($el => {
                // optional: Style-Check
                expect($el).to.have.css("background-color");
            });
    });

    it("➔ Sortier-Select ‚priority‘ sortiert High→Medium→Low", () => {
        // Seed: drei Tasks mit unterschiedlicher priority
        const now = Date.now();
        const tasks = [
            {
                id: "prio-low",
                text: "Low",
                priority: "low",
                createdAt: new Date(now).toISOString(),
                doneAt: null,
                isDone: false,
                order: 0
            },
            {
                id: "prio-high",
                text: "High",
                priority: "high",
                createdAt: new Date(now).toISOString(),
                doneAt: null,
                isDone: false,
                order: 1
            },
            {
                id: "prio-medium",
                text: "Medium",
                priority: "medium",
                createdAt: new Date(now).toISOString(),
                doneAt: null,
                isDone: false,
                order: 2
            }
        ];
        cy.window().then(win => {
            win.localStorage.setItem("todoTasks", JSON.stringify(tasks));
        });
        cy.visit("/");

        // Select auf „⚡ Priorität“ setzen
        cy.get("#sortSelect").select("priority");
        cy.wait(200); // kurzes Warten, damit render() neu sortiert

        cy.get("#todo-list li span[aria-label='Tasktext']").then($els => {
            const order = $els.map((i, el) => Cypress.$(el).text()).get();
            expect(order).to.deep.equal(["High", "Medium", "Low"]);
        });
    });
});
