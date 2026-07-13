/* ============================================================
   FOUAD SHOP ADMIN — SETTINGS
   ============================================================ */

window.SettingsPage = (function () {
    let logoUrl = "";
    let bannerUrl = "";

    async function mount() {
        const root = document.getElementById("page-settings");
        root.innerHTML = `
            <div class="panel settings-panel">
                <div class="panel-head"><h3>Informations de la boutique</h3></div>
                <form id="settingsForm">
                    <div class="form-row">
                        <label>Nom de la boutique</label>
                        <input type="text" id="s-storeName">
                    </div>

                    <div class="form-row form-row-split">
                        <div>
                            <label>Devise</label>
                            <input type="text" id="s-currency" maxlength="6">
                        </div>
                        <div>
                            <label>Prix de livraison (par défaut)</label>
                            <input type="number" id="s-deliveryPrice" min="0">
                        </div>
                    </div>

                    <div class="form-row form-row-split">
                        <div>
                            <label>Logo de la boutique</label>
                            <input type="file" id="s-logoFile" accept="image/*">
                            <div id="s-logoPreviewWrap" class="image-preview-wrap" hidden><img id="s-logoPreview"></div>
                        </div>
                        <div>
                            <label>Bannière de la boutique</label>
                            <input type="file" id="s-bannerFile" accept="image/*">
                            <div id="s-bannerPreviewWrap" class="image-preview-wrap" hidden><img id="s-bannerPreview"></div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary" id="saveSettingsBtn">Enregistrer les modifications</button>
                    </div>
                </form>
            </div>
        `;

        root.querySelector("#s-logoFile").addEventListener("change", (e) => handleUpload(e, "logo"));
        root.querySelector("#s-bannerFile").addEventListener("change", (e) => handleUpload(e, "banner"));
        root.querySelector("#settingsForm").addEventListener("submit", handleSubmit);

        try {
            const settings = await Api.getSettings();
            document.getElementById("s-storeName").value = settings.storeName || "";
            document.getElementById("s-currency").value = settings.currency || "";
            document.getElementById("s-deliveryPrice").value = settings.deliveryPrice ?? 0;
            logoUrl = settings.logoUrl || "";
            bannerUrl = settings.bannerUrl || "";
            if (logoUrl) {
                document.getElementById("s-logoPreviewWrap").hidden = false;
                document.getElementById("s-logoPreview").src = resolveImageUrl(logoUrl);
            }
            if (bannerUrl) {
                document.getElementById("s-bannerPreviewWrap").hidden = false;
                document.getElementById("s-bannerPreview").src = resolveImageUrl(bannerUrl);
            }
        } catch (err) {
            toast(err.message, "error");
        }
    }

    async function handleUpload(e, kind) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = await Api.uploadImage(file);
            if (kind === "logo") {
                logoUrl = data.imageUrl;
                document.getElementById("s-logoPreviewWrap").hidden = false;
                document.getElementById("s-logoPreview").src = resolveImageUrl(logoUrl);
            } else {
                bannerUrl = data.imageUrl;
                document.getElementById("s-bannerPreviewWrap").hidden = false;
                document.getElementById("s-bannerPreview").src = resolveImageUrl(bannerUrl);
            }
            toast("Image envoyée");
        } catch (err) {
            toast(err.message, "error");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById("saveSettingsBtn");
        btn.disabled = true;
        btn.textContent = "Enregistrement...";

        try {
            await Api.updateSettings({
                storeName: document.getElementById("s-storeName").value.trim(),
                currency: document.getElementById("s-currency").value.trim(),
                deliveryPrice: Number(document.getElementById("s-deliveryPrice").value) || 0,
                logoUrl,
                bannerUrl,
            });
            toast("Paramètres enregistrés");
        } catch (err) {
            toast(err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Enregistrer les modifications";
        }
    }

    return { mount };
})();
