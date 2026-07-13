/* ============================================================
   FOUAD SHOP ADMIN — ORDERS
   ============================================================ */

window.OrdersPage = (function () {
    let currency = "DA";
    let currentStatus = "";
    let currentSearch = "";

    const STATUS_FLOW = [
        { key: "processing", label: "Confirmer", icon: "fa-check" },
        { key: "shipped", label: "Expédier", icon: "fa-truck-fast" },
        { key: "delivered", label: "Livrée", icon: "fa-box-check" },
        { key: "cancelled", label: "Annuler", icon: "fa-xmark" },
    ];

    async function mount() {
        const root = document.getElementById("page-orders");
        root.innerHTML = `
            <div class="toolbar">
                <div class="search-input">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="orderSearch" placeholder="Rechercher par nom ou téléphone...">
                </div>
                <div class="status-tabs" id="statusTabs">
                    <button class="status-tab active" data-status="">Toutes</button>
                    <button class="status-tab" data-status="pending">En attente</button>
                    <button class="status-tab" data-status="processing">En traitement</button>
                    <button class="status-tab" data-status="shipped">Expédiées</button>
                    <button class="status-tab" data-status="delivered">Livrées</button>
                    <button class="status-tab" data-status="cancelled">Annulées</button>
                </div>
            </div>
            <div id="ordersList" class="orders-list">${skeleton()}</div>
        `;

        root.querySelector("#orderSearch").addEventListener("input", debounce((e) => {
            currentSearch = e.target.value.trim();
            loadOrders();
        }, 300));

        root.querySelectorAll(".status-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                root.querySelectorAll(".status-tab").forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                currentStatus = tab.dataset.status;
                loadOrders();
            });
        });

        try {
            const settings = await Api.getSettings();
            currency = settings.currency || "DA";
        } catch (e) { /* non-blocking */ }

        await loadOrders();
    }

    function skeleton() {
        return Array.from({ length: 3 }).map(() => `<div class="order-card skeleton" style="height:220px"></div>`).join("");
    }

    async function loadOrders() {
        const list = document.getElementById("ordersList");
        if (!list) return;
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (currentStatus) params.set("status", currentStatus);
            if (currentSearch) params.set("search", currentSearch);
            const data = await Api.getOrders(`?${params.toString()}`);
            renderOrders(data.orders || []);
        } catch (err) {
            list.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
        }
    }

    async function refresh() {
        await loadOrders();
    }

    function renderOrders(orders) {
        const list = document.getElementById("ordersList");
        if (!orders.length) {
            list.innerHTML = `<p class="muted">Aucune commande trouvée.</p>`;
            return;
        }

        list.innerHTML = orders.map((order) => {
            const itemsHtml = order.items.map((item) => {
                const sizeLabel = item.size ? ` — Taille : ${escapeHtml(item.size)}` : "";
                return `
                <div class="order-item-row">
                    <div class="order-item-info">
                        <span class="order-item-name">${escapeHtml(item.name)}${sizeLabel}</span>
                        <span class="muted">Qté: ${item.quantity} × ${formatMoney(item.price, currency)}</span>
                    </div>
                    <span class="order-item-subtotal">${formatMoney(item.price * item.quantity, currency)}</span>
                </div>
            `;
            }).join("");

            const actionsHtml = STATUS_FLOW.map((s) => `
                <button class="btn btn-sm status-btn status-btn-${s.key}" data-status="${s.key}" data-id="${order._id}" ${order.status === s.key ? "disabled" : ""}>
                    <i class="fa-solid ${s.icon}"></i> ${s.label}
                </button>
            `).join("");

            return `
                <div class="order-card" data-order-id="${order._id}">
                    <div class="order-card-head order-card-head-clickable" data-order-id="${order._id}">
                        <div>
                            <h4><i class="fa-solid fa-user"></i> ${escapeHtml(order.customer.name)}</h4>
                            <p class="muted">${formatDate(order.createdAt)} · #${order._id.slice(-6).toUpperCase()}</p>
                        </div>
                        ${statusBadge(order.status)}
                    </div>

                    <div class="order-customer-grid">
                        <span><i class="fa-solid fa-phone"></i> ${escapeHtml(order.customer.phone)}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(order.customer.wilaya || "-")}</span>
                        <span class="span-2"><i class="fa-solid fa-house"></i> ${escapeHtml(order.customer.address || "-")}</span>
                        ${order.deliveryNotes ? `<span class="span-2"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(order.deliveryNotes)}</span>` : ""}
                        <span><i class="fa-solid fa-credit-card"></i> ${order.paymentMethod === "card" ? "Carte" : "Paiement à la livraison"}</span>
                    </div>

                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-detail-panel" id="order-detail-${order._id}" hidden></div>

                    <div class="order-card-footer">
                        <div class="order-total">
                            ${order.deliveryPrice ? `<span class="muted">Livraison: ${formatMoney(order.deliveryPrice, currency)}</span>` : ""}
                            <span class="order-total-amount">Total: ${formatMoney(order.totalPrice, currency)}</span>
                        </div>
                        <div class="order-actions">${actionsHtml}</div>
                    </div>
                </div>
            `;
        }).join("");

        list.querySelectorAll(".status-btn").forEach((btn) => {
            btn.addEventListener("click", () => handleStatusChange(btn.dataset.id, btn.dataset.status));
        });

        list.querySelectorAll(".order-card-head-clickable").forEach((head) => {
            head.addEventListener("click", () => toggleOrderDetail(head.dataset.orderId));
        });
    }

    async function toggleOrderDetail(orderId) {
        const panel = document.getElementById(`order-detail-${orderId}`);
        if (!panel) return;

        if (!panel.hidden) {
            panel.hidden = true;
            panel.innerHTML = "";
            return;
        }

        panel.hidden = false;
        panel.innerHTML = `<p class="muted">Chargement des détails...</p>`;

        try {
            const order = await Api.getOrder(orderId);
            const detailItems = (order.items || []).map((item) => {
                const sizeText = item.size ? ` — Taille : ${escapeHtml(item.size)}` : "";
                return `<li>${escapeHtml(item.name)}${sizeText} · Qté ${item.quantity} × ${formatMoney(item.price, currency)}</li>`;
            }).join("");

            panel.innerHTML = `
                <div class="order-detail-box">
                    <h5>Détails de la commande</h5>
                    <ul class="order-detail-list">${detailItems || "<li>Aucun article</li>"}</ul>
                </div>
            `;
        } catch (err) {
            panel.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
        }
    }

    async function handleStatusChange(id, status) {
        try {
            await Api.updateOrderStatus(id, status);
            toast("Statut mis à jour");
            await loadOrders();
        } catch (err) {
            toast(err.message, "error");
        }
    }

    return { mount, refresh };
})();
