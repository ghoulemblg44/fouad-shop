/* ============================================================
   FOUAD SHOP ADMIN — STATISTICS
   Uses Chart.js (loaded via CDN in admin.html).
   ============================================================ */

window.StatisticsPage = (function () {
    let currency = "DA";
    let dailyChart = null;
    let monthlyChart = null;
    let topProductsChart = null;

    async function mount() {
        const root = document.getElementById("page-statistics");
        root.innerHTML = `
            <div class="cards-grid" id="statCards">
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
            </div>
            <div class="panel-grid">
                <section class="panel">
                    <div class="panel-head"><h3>Ventes quotidiennes (14 derniers jours)</h3></div>
                    <canvas id="dailyChart" height="220"></canvas>
                </section>
                <section class="panel">
                    <div class="panel-head"><h3>Ventes mensuelles (12 derniers mois)</h3></div>
                    <canvas id="monthlyChart" height="220"></canvas>
                </section>
            </div>
            <section class="panel">
                <div class="panel-head"><h3>Produits les plus vendus</h3></div>
                <canvas id="topProductsChart" height="180"></canvas>
            </section>
        `;

        try {
            const settings = await Api.getSettings();
            currency = settings.currency || "DA";
        } catch (e) { /* non-blocking */ }

        try {
            const stats = await Api.getStatistics();
            renderCards(stats);
            renderDailyChart(stats.dailySales || []);
            renderMonthlyChart(stats.monthlySales || []);
            renderTopProducts(stats.topProducts || []);
        } catch (err) {
            toast(err.message, "error");
        }
    }

    function renderCards(stats) {
        const totalRevenue14d = (stats.dailySales || []).reduce((s, d) => s + d.revenue, 0);
        const totalOrders14d = (stats.dailySales || []).reduce((s, d) => s + d.orders, 0);

        document.getElementById("statCards").innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background:#16a34a1a;color:#16a34a"><i class="fa-solid fa-sack-dollar"></i></div>
                <div><p class="stat-label">Revenus (14j)</p><p class="stat-value">${formatMoney(totalRevenue14d, currency)}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#2563eb1a;color:#2563eb"><i class="fa-solid fa-cart-shopping"></i></div>
                <div><p class="stat-label">Commandes (14j)</p><p class="stat-value">${totalOrders14d}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#8b5cf61a;color:#8b5cf6"><i class="fa-solid fa-shirt"></i></div>
                <div><p class="stat-label">Unités vendues (total)</p><p class="stat-value">${stats.unitsSold}</p></div>
            </div>
        `;
    }

    function baseChartOptions() {
        return {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
        };
    }

    function renderDailyChart(rows) {
        const ctx = document.getElementById("dailyChart");
        if (dailyChart) dailyChart.destroy();
        dailyChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: rows.map((r) => r._id.slice(5)),
                datasets: [{
                    label: "Revenus",
                    data: rows.map((r) => r.revenue),
                    borderColor: "#ff4d23",
                    backgroundColor: "rgba(255,77,35,0.1)",
                    tension: 0.35,
                    fill: true,
                }],
            },
            options: baseChartOptions(),
        });
    }

    function renderMonthlyChart(rows) {
        const ctx = document.getElementById("monthlyChart");
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: rows.map((r) => r._id),
                datasets: [{
                    label: "Revenus",
                    data: rows.map((r) => r.revenue),
                    backgroundColor: "#2563eb",
                    borderRadius: 6,
                }],
            },
            options: baseChartOptions(),
        });
    }

    function renderTopProducts(rows) {
        const ctx = document.getElementById("topProductsChart");
        if (topProductsChart) topProductsChart.destroy();
        topProductsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: rows.map((r) => r._id),
                datasets: [{
                    label: "Unités vendues",
                    data: rows.map((r) => r.unitsSold),
                    backgroundColor: "#16a34a",
                    borderRadius: 6,
                }],
            },
            options: { ...baseChartOptions(), indexAxis: "y" },
        });
    }

    return { mount };
})();
