describe("F-09: Light/Dark Theme", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.window().then(win => {
            win.localStorage.removeItem("theme");
        });
    });

    it("➔ Klick auf #theme-toggle schaltet Theme und speichert in localStorage", () => {
        cy.get("html")
            .invoke("attr", "data-theme")
            .then(start => {
                cy.get("#theme-toggle").click();
                cy.get("html")
                    .invoke("attr", "data-theme")
                    .should("not.equal", start)
                    .then(next => {
                        cy.window().its("localStorage.theme").should("equal", next);
                        cy.get("#theme-toggle").click();
                        cy.get("html").invoke("attr", "data-theme").should("equal", start);
                        cy.window().its("localStorage.theme").should("equal", start);
                    });
            });
    });

    it("➔ Lädt dunkles Theme, wenn localStorage vorher auf ‚dark‘ gesetzt ist", () => {
        cy.window().then(win => {
            win.localStorage.setItem("theme", "dark");
        });
        cy.visit("/");
        cy.get("html").should("have.attr", "data-theme", "dark");
    });

    it("➔ Nutzt prefers-color-scheme, wenn kein localStorage-Eintrag existiert", () => {
        // Simuliere prefers-color-scheme: dark
        cy.visit("/", {
            onBeforeLoad(win) {
                Object.defineProperty(win, "matchMedia", {
                    value: query => ({
                        matches: query.includes("dark"),
                        media: query,
                        addListener: () => {},
                        removeListener: () => {}
                    })
                });
            }
        });
        cy.get("html").should("have.attr", "data-theme", "dark");
    });
});
