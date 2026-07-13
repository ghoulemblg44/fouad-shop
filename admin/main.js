/* ============================================================
   FOUAD SHOP ADMIN — MAIN
   Login/logout session handling, then boots the router.
   ============================================================ */

function showApp() {
    document.getElementById("loginSection").hidden = true;
    document.getElementById("appShell").hidden = false;
    initRouter();
}

function showLogin() {
    document.getElementById("loginSection").hidden = false;
    document.getElementById("appShell").hidden = true;
}

window.addEventListener("fs:unauthorized", () => {
    showLogin();
    toast("Session expirée, merci de vous reconnecter.", "error");
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");
    errorEl.textContent = "";
    btn.disabled = true;
    btn.textContent = "Connexion...";

    try {
        const data = await Api.login(username, password);
        Auth.setToken(data.token);
        document.getElementById("adminUsername").textContent = data.admin.username;
        showApp();
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = "Se connecter";
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    Auth.clearToken();
    showLogin();
});

(async function init() {
    if (!Auth.isLoggedIn()) {
        showLogin();
        return;
    }
    try {
        const { admin } = await Api.me();
        document.getElementById("adminUsername").textContent = admin.username;
        showApp();
    } catch (err) {
        showLogin();
    }
})();
