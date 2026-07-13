/* ============================================================
   FOUAD SHOP ADMIN — ROUTER
   Handles sidebar navigation between pages (no page reload).
   Each page module exposes a `mount()` function that (re)loads its data.
   ============================================================ */

const PAGE_LOADERS = {
    home: () => window.DashboardPage.mount(),
    products: () => window.ProductsPage.mount(),
    orders: () => window.OrdersPage.mount(),
    customers: () => window.CustomersPage.mount(),
    statistics: () => window.StatisticsPage.mount(),
    settings: () => window.SettingsPage.mount(),
};

const PAGE_TITLES = {
    home: "Tableau de bord",
    products: "Produits",
    orders: "Commandes",
    customers: "Clients",
    statistics: "Statistiques",
    settings: "Paramètres",
};

let currentPage = null;

function navigateTo(page) {
    if (!PAGE_LOADERS[page]) return;

    document.querySelectorAll(".sidebar .menu-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.page === page);
    });

    document.querySelectorAll(".page").forEach((el) => {
        el.hidden = el.id !== `page-${page}`;
    });

    const titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = PAGE_TITLES[page] || "";

    window.location.hash = page;

    // Only mount once per page — avoids destroying the products grid (and
    // scroll position) when revisiting or after an image edit.
    if (currentPage !== page) {
        PAGE_LOADERS[page]();
        currentPage = page;
    } else if (page === "orders" && window.OrdersPage?.refresh) {
        window.OrdersPage.refresh();
    }
}

function initRouter() {
    document.querySelectorAll(".sidebar .menu-item[data-page]").forEach((item) => {
        item.addEventListener("click", () => navigateTo(item.dataset.page));
    });

    const initial = (window.location.hash || "#home").replace("#", "");
    navigateTo(PAGE_LOADERS[initial] ? initial : "home");
}
