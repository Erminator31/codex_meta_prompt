describe("F-07: Drag-and-Drop Reorder (ohne Plugin)", () => {
    beforeEach(() => {
        // 1) Seite öffnen & alten Speicher löschen
        cy.visit("/");
        cy.window().then(win => win.localStorage.removeItem("todoTasks"));

        // 2) Zwei offene Tasks in localStorage seeden: A (order:0) und B (order:1)
        const now = Date.now();
        const tasks = [
            {
                id: "task-A",
                text: "Task A",
                priority: "low",
                createdAt: new Date(now).toISOString(),
                doneAt: null,
                isDone: false,
                order: 0
            },
            {
                id: "task-B",
                text: "Task B",
                priority: "low",
                createdAt: new Date(now).toISOString(),
                doneAt: null,
                isDone: false,
                order: 1
            }
        ];
        cy.window().then(win => win.localStorage.setItem("todoTasks", JSON.stringify(tasks)));

        // 3) Seite neu laden, damit render() den neuen Speicherstand anzeigt
        cy.visit("/");
    });

    it("➔ Zieht Task B nach oben und persistiert Order in localStorage", () => {
        // 1) Zuerst das <li> für B und A selektieren
        cy.get('li[data-id="task-B"]').as("elB");
        cy.get('li[data-id="task-A"]').as("elA");

        // 2) Manuelles DataTransfer-Objekt erzeugen
        cy.window().then(win => {
            const dt = new DataTransfer();         // nativer DataTransfer-Konstruktor

            // 3) Drag-Start an Task B auslösen, DataTransfer übergeben
            cy.get("@elB").trigger("dragstart", { dataTransfer: dt });

            // 4) DragOver auf Task A auslösen, damit B visuell darüber landet
            cy.get("@elA").trigger("dragover", { dataTransfer: dt });

            // 5) Drop-Event auf Task A auslösen
            cy.get("@elA").trigger("drop", { dataTransfer: dt });

            // 6) DragEnd auf Task B auslösen, sodass der Handler in deinem Code
            //    die neue Reihenfolge in localStorage schreibt
            cy.get("@elB").trigger("dragend");
        });

        // 7) Überprüfen: In der UI muss „Task B“ jetzt als erstes <li> stehen
        cy.get("#todo-list li")
            .first()
            .within(() => {
                cy.get("span[aria-label='Tasktext']").should("contain.text", "Task B");
            });

        // 8) Überprüfen: localStorage["todoTasks"] enthält B mit order=0, A mit order=1
        cy.window().then(win => {
            const updated = JSON.parse(win.localStorage.getItem("todoTasks"));
            // Sortiere nach order, um auf Index 0 & 1 zu vergleichen
            const sorted = updated.sort((a, b) => a.order - b.order);
            expect(sorted[0].id).to.equal("task-B");
            expect(sorted[1].id).to.equal("task-A");
        });
    });
});
