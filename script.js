const STORAGE_KEY = "home-layout";

function applyLayout(layout) {
    const body = document.body;
    const toggle = document.getElementById("layout-toggle");
    const label = toggle?.querySelector(".layout-toggle-label");
    const isSmall = layout !== "classic";

    body.classList.toggle("layout-small", isSmall);
    body.classList.toggle("layout-classic", !isSmall);

    if (!toggle || !label) {
        return;
    }

    toggle.setAttribute("aria-pressed", String(isSmall));
    toggle.setAttribute("aria-label", isSmall ? "Przełącz na duże karty" : "Przełącz na małe karty");
    label.textContent = isSmall ? "Duże karty" : "Małe karty";
}

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("layout-toggle");
    const savedLayout = localStorage.getItem(STORAGE_KEY);

    applyLayout(savedLayout === "classic" ? "classic" : "small");

    toggle?.addEventListener("click", () => {
        const nextLayout = document.body.classList.contains("layout-small") ? "classic" : "small";
        applyLayout(nextLayout);
        localStorage.setItem(STORAGE_KEY, nextLayout);
    });

    if (window.matchMedia("(pointer: coarse)").matches) {
        const rybakCard = document.getElementById("rybak-card");

        if (rybakCard) {
            rybakCard.href = "./rybak/mobile/";
        }
    }
});
