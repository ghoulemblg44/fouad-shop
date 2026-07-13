/* ============================================================
   FOUAD SHOP ADMIN — CUSTOMERS
   ============================================================ */

window.CustomersPage = (function () {
    let currency = "DA";

    async function mount() {
        const root = document.getElementById("page-customers");
        root.innerHTML = `
            <div class="panel">
                <div class="panel-head"><h3>Tous les clients</h3></div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Téléphone</th>
                                <th>Localisation</th>
                                <th>Commandes</th>
                                <th>Total dépensé</th>
                                <th>Dernière commande</th>
                            </tr>
                        </thead>
                        <tbody id="customersBody">
                            <tr><td colspan="6" class="muted">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        try {
            const settings = await Api.getSettings();
            currency = settings.currency || "DA";
        } catch (e) { /* non-blocking */ }

        try {
            const data = await Api.getCustomers("?limit=100");
            renderTable(data.customers || []);
        } catch (err) {
            document.getElementById("customersBody").innerHTML =
                `<tr><td colspan="6" class="muted">${escapeHtml(err.message)}</td></tr>`;
        }
    }

    function renderTable(customers) {
        const body = document.getElementById("customersBody");
        if (!customers.length) {
            body.innerHTML = `<tr><td colspan="6" class="muted">Aucun client pour le moment.</td></tr>`;
            return;
        }

        body.innerHTML = customers.map((c) => `
            <tr>
                <td>
                    <div class="customer-cell">
                        <span class="avatar-circle">${escapeHtml((c.name || "?").charAt(0).toUpperCase())}</span>
                        <span>${escapeHtml(c.name || "Client")}</span>
                    </div>
                </td>
                <td>${escapeHtml(c.phone || "-")}</td>
                <td>${escapeHtml(c.wilaya || "-")}</td>
                <td>${c.totalOrders}</td>
                <td>${formatMoney(c.totalSpent, currency)}</td>
                <td>${formatDate(c.lastOrderDate)}</td>
            </tr>
        `).join("");
    }

    return { mount };
})();
