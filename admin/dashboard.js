/* ============================================================
   FOUAD SHOP ADMIN — DASHBOARD HOME
   ============================================================ */

window.DashboardPage = (function () {
    let currency = "DA";

    async function mount() {
        const root = document.getElementById("page-home");
        root.innerHTML = `
            <div class="cards-grid" id="homeCards">
                ${skeletonCards(4)}
            </div>

            <div class="panel-grid">
                <section class="panel">
                    <div class="panel-head">
                        <h3>Commandes récentes</h3>
                        <button class="btn-link" data-page="orders">Voir tout →</button>
                    </div>
                    <div id="recentOrdersList" class="mini-list">
                        <p class="muted">Chargement...</p>
                    </div>
                </section>

                <section class="panel">
                    <div class="panel-head"><h3>Aperçu des commandes</h3></div>
                    <div id="statusBreakdown" class="status-breakdown">
                        <p class="muted">Chargement...</p>
                    </div>
                </section>
            </div>
        `;

        root.querySelector('[data-page="orders"]').addEventListener("click", () => navigateTo("orders"));

        try {
            const [stats, settings] = await Promise.all([Api.getStats(), Api.getSettings()]);
            currency = settings.currency || "DA";
            renderCards(stats);
            renderRecentOrders(stats.recentOrders || []);
            renderStatusBreakdown(stats.ordersByStatus || {});
        } catch (err) {
            toast(err.message, "error");
        }
    }

    function skeletonCards(n) {
        return Array.from({ length: n }).map(() => `<div class="stat-card skeleton"></div>`).join("");
    }

    function renderCards(stats) {
        const cards = [
            { label: "Produits", value: stats.totalProducts, icon: "fa-box", color: "#2563eb" },
            { label: "Commandes", value: stats.totalOrders, icon: "fa-cart-shopping", color: "#8b5cf6" },
            { label: "Revenus", value: formatMoney(stats.totalRevenue, currency), icon: "fa-sack-dollar", color: "#16a34a" },
            { label: "Stock faible", value: stats.lowStock, icon: "fa-triangle-exclamation", color: "#dc2626" },
        ];

        document.getElementById("homeCards").innerHTML = cards.map((c) => `
            <div class="stat-card">
                <div class="stat-icon" style="background:${c.color}1a;color:${c.color}"><i class="fa-solid ${c.icon}"></i></div>
                <div>
                    <p class="stat-label">${c.label}</p>
                    <p class="stat-value">${c.value}</p>
                </div>
            </div>
        `).join("");
    }

    function renderRecentOrders(orders) {
        const el = document.getElementById("recentOrdersList");
        if (!orders.length) {
            el.innerHTML = `<p class="muted">Aucune commande pour le moment.</p>`;
            return;
        }
        el.innerHTML = orders.map((o) => `
            <div class="mini-row">
                <div>
                    <p class="mini-title">${escapeHtml(o.customer.name)}</p>
                    <p class="mini-sub">${formatDate(o.createdAt)}</p>
                </div>
                <div class="mini-right">
                    <p class="mini-title">${formatMoney(o.totalPrice, currency)}</p>
                    ${statusBadge(o.status)}
                </div>
            </div>
        `).join("");
    }

    function renderStatusBreakdown(breakdown) {
        const el = document.getElementById("statusBreakdown");
        const order = ["pending", "processing", "shipped", "delivered", "cancelled"];
        const total = order.reduce((sum, k) => sum + (breakdown[k] || 0), 0) || 1;

        el.innerHTML = order.map((key) => {
            const count = breakdown[key] || 0;
            const pct = Math.round((count / total) * 100);
            const meta = STATUS_META[key];
            return `
                <div class="breakdown-row">
                    <span class="breakdown-label">${meta.label}</span>
                    <div class="breakdown-bar"><div class="breakdown-fill" style="width:${pct}%;background:${meta.color}"></div></div>
                    <span class="breakdown-count">${count}</span>
                </div>
            `;
        }).join("");
    }

    return { mount };
})();
