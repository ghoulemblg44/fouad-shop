/* ============================================================
   FOUAD SHOP ADMIN — SHARED UTILITIES
   ============================================================ */

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
}

function formatMoney(n, currency = "DA") {
    return `${Number(n || 0).toLocaleString("fr-FR")} ${currency}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
        " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Lightweight toast notification system. Adds a stack container to the
 * body on first use.
 */
function toast(message, type = "success") {
    let stack = document.getElementById("toastStack");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "toastStack";
        stack.className = "toast-stack";
        document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fa-solid ${type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info"}"></i><span>${escapeHtml(message)}</span>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 250);
    }, 3500);
}

const STATUS_META = {
    pending: { label: "En attente", color: "#f59e0b" },
    processing: { label: "En traitement", color: "#3b82f6" },
    shipped: { label: "Expédiée", color: "#8b5cf6" },
    delivered: { label: "Livrée", color: "#16a34a" },
    cancelled: { label: "Annulée", color: "#dc2626" },
};

function statusBadge(status) {
    const meta = STATUS_META[status] || { label: status, color: "#6b7280" };
    return `<span class="badge" style="--badge-color:${meta.color}">${meta.label}</span>`;
}

/**
 * Simple confirm dialog replacement (kept as native confirm() for now to
 * avoid overengineering, but centralized so it can be swapped for a
 * styled modal later without touching every call site).
 */
function confirmAction(message) {
    return window.confirm(message);
}
