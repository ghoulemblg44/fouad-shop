/* ============================================================
   FOUAD SHOP ADMIN — API LAYER
   Every network call to the backend goes through here.
   ============================================================ */

   const isLocal =
   window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1" ||
   window.location.protocol === "file:";

const API_BASE = isLocal
   ? "http://localhost:5000/api"
   : "https://fouad-shop.onrender.com/api";

const ORIGIN_BASE = API_BASE.replace(/\/api$/, "");

const TOKEN_KEY = "fs_admin_token";

const Auth = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),
    isLoggedIn: () => Boolean(localStorage.getItem(TOKEN_KEY)),
};

/**
 * Resolves a product/order image path to a full URL. Cloudinary images
 * already come back as absolute https:// URLs; legacy local-disk images
 * are relative (e.g. "/uploads/xyz.jpg") and need the API origin prefixed.
 */
function resolveImageUrl(image) {
    if (!image) return "https://placehold.co/400x500?text=No+Image";

    let img = String(image).trim().replace(/\\/g, "/");
    if (!img) return "https://placehold.co/400x500?text=No+Image";

    // Cloudinary / any absolute URL -> use as-is.
    if (/^https?:\/\//i.test(img)) return img;

    // New uploads stored on the backend, e.g. "/uploads/xyz.jpg" or
    // "uploads/xyz.jpg" -> prefix with the API origin.
    if (/^\/?uploads\//i.test(img)) return ORIGIN_BASE + "/" + img.replace(/^\/+/, "");

    // Old products: DB may store either a bare filename ("hoodie.jpg")
    // or a path that already includes the folder ("images/hoodie.jpg",
    // "/images/hoodie.jpg"). Normalize both to a single "images/..." path
    // so we never end up requesting "images/images/hoodie.jpg" (which
    // 404s and was showing "No Image" for perfectly valid old products).
    img = img.replace(/^\/+/, "").replace(/^images\//i, "");
    return `images/${encodeURI(img)}`;
}

/**
 * Core request helper. Throws an Error with a readable message on failure
 * and automatically logs the admin out on a 401.
 */
async function apiRequest(path, { method = "GET", body, isForm = false, auth = true } = {}) {
    const headers = {};
    if (!isForm) headers["Content-Type"] = "application/json";
    if (auth && Auth.getToken()) headers["Authorization"] = `Bearer ${Auth.getToken()}`;

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (err) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }

    if (res.status === 401 && auth) {
        Auth.clearToken();
        window.dispatchEvent(new CustomEvent("fs:unauthorized"));
        throw new Error("Session expirée, merci de vous reconnecter.");
    }

    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        /* no JSON body (e.g. 204) */
    }

    if (res.status === 401) {
        const message = data?.message || "Identifiants incorrects.";
        throw new Error(message);
    }

    if (!res.ok) {
        const message = data?.message || `Erreur (${res.status})`;
        throw new Error(message);
    }

    return data;
}

const Api = {
    // --- Auth ---
    login: (username, password) =>
        apiRequest("/auth/login", { method: "POST", body: { username, password }, auth: false }),
    me: () => apiRequest("/auth/me"),

    // --- Products ---
    getProducts: (query = "") => apiRequest(`/products${query}`, { auth: false }),
    getProduct: (id) => apiRequest(`/products/${id}`, { auth: false }),
    createProduct: (product) => apiRequest("/products", { method: "POST", body: product }),
    updateProduct: (id, product) => apiRequest(`/products/${id}`, { method: "PUT", body: product }),
    deleteProduct: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),

    // --- Upload ---
    uploadImage: (file) => {
        const form = new FormData();
        form.append("image", file);
        return apiRequest("/upload", { method: "POST", body: form, isForm: true });
    },

    // --- Orders ---
    getOrders: (query = "") => apiRequest(`/orders${query}`),
    getOrder: (id) => apiRequest(`/orders/${id}`),
    updateOrderStatus: (id, status) =>
        apiRequest(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
    deleteOrder: (id) => apiRequest(`/orders/${id}`, { method: "DELETE" }),

    // --- Customers ---
    getCustomers: (query = "") => apiRequest(`/customers${query}`),

    // --- Dashboard / statistics ---
    getStats: () => apiRequest("/dashboard/stats"),
    getStatistics: () => apiRequest("/dashboard/statistics"),

    // --- Settings ---
    getSettings: () => apiRequest("/settings", { auth: false }),
    updateSettings: (settings) => apiRequest("/settings", { method: "PUT", body: settings }),
};
