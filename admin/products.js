/* ============================================================
   FOUAD SHOP ADMIN — PRODUCTS
   ============================================================ */

window.ProductsPage = (function () {
    const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
    let products = [];
    let currency = "DA";
    let editingId = null;
    let uploadedImageUrl = "";
    let previousImageUrl = "";
    let imageUploading = false;
    let pageReady = false;

    function getScrollEl() {
        return document.querySelector(".main .content") || document.documentElement;
    }

    function saveScroll() {
        const el = getScrollEl();
        return el.scrollTop;
    }

    function restoreScroll(top) {
        const el = getScrollEl();
        el.scrollTop = top;
    }

    async function mount() {
        if (pageReady) return;

        const root = document.getElementById("page-products");
        root.innerHTML = `
            <div class="toolbar">
                <div class="search-input">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="productSearch" placeholder="Rechercher un produit...">
                </div>
                <select id="categoryFilter">
                    <option value="">Toutes les catégories</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="enfant">Enfant</option>
                    <option value="accessoires">Accessoires</option>
                </select>
                <button class="btn btn-primary" id="openAddProduct"><i class="fa-solid fa-plus"></i> Ajouter un produit</button>
            </div>
            <div class="product-grid-admin" id="productGrid">${skeleton()}</div>
        `;

        root.querySelector("#openAddProduct").addEventListener("click", () => openModal());
        root.querySelector("#productSearch").addEventListener("input", debounce(applyFilters, 250));
        root.querySelector("#categoryFilter").addEventListener("change", applyFilters);

        ensureModal();

        try {
            const settings = await Api.getSettings();
            currency = settings.currency || "DA";
        } catch (e) { /* non-blocking */ }

        await loadProducts();
        pageReady = true;
    }

    function skeleton() {
        return Array.from({ length: 6 }).map(() => `<div class="product-card-admin skeleton" style="height:320px"></div>`).join("");
    }

    async function loadProducts() {
        try {
            products = await Api.getProducts();
            renderGrid(products);
        } catch (err) {
            toast(err.message, "error");
        }
    }

    function applyFilters() {
        const search = document.getElementById("productSearch").value.trim().toLowerCase();
        const category = document.getElementById("categoryFilter").value;
        const filtered = products.filter((p) => {
            const matchesSearch = !search || p.name.toLowerCase().includes(search);
            const matchesCategory = !category || (p.category || "").toLowerCase() === category;
            return matchesSearch && matchesCategory;
        });
        renderGrid(filtered);
    }

    function renderGrid(list) {
        const grid = document.getElementById("productGrid");
        const scrollTop = saveScroll();
        if (!list.length) {
            grid.innerHTML = `<p class="muted">Aucun produit trouvé.</p>`;
            restoreScroll(scrollTop);
            return;
        }

        grid.innerHTML = list.map((p) => buildProductCardHtml(p)).join("");

        grid.querySelectorAll(".product-card-admin").forEach((card) => bindProductCardActions(card));

        restoreScroll(scrollTop);
    }

    async function handleDelete(id) {
        const product = products.find((p) => p._id === id);
        if (!confirmAction(`Supprimer "${product?.name || "ce produit"}" ? Cette action est irréversible.`)) return;
        try {
            await Api.deleteProduct(id);
            toast("Produit supprimé");
            await loadProducts();
        } catch (err) {
            toast(err.message, "error");
        }
    }

    /* ---------- Modal (add / edit) ---------- */

    function buildProductCardHtml(p) {
        return `
            <div class="product-card-admin" data-id="${p._id}">
                ${p.isFeatured ? `<span class="featured-badge"><i class="fa-solid fa-star"></i> Vedette</span>` : ""}
                <img src="${resolveImageUrl(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/400x500?text=No+Image'">
                <div class="product-card-admin-body">
                    <div class="product-card-admin-top">
                        <h4>${escapeHtml(p.name)}</h4>
                        <span class="price-tag">${formatMoney(p.price, currency)}</span>
                    </div>
                    <p class="muted line-clamp">${escapeHtml(p.description)}</p>
                    <div class="chip-row">
                        <span class="chip">${escapeHtml(p.category || "Non classé")}</span>
                        <span class="chip ${p.stock <= 5 ? "chip-warn" : ""}">Stock: ${p.stock ?? 0}</span>
                        ${(p.sizes || []).map((s) => `<span class="chip chip-size">${escapeHtml(s)}</span>`).join("")}
                    </div>
                    <div class="product-card-admin-actions">
                        <button type="button" class="btn btn-sm" data-edit="${p._id}"><i class="fa-solid fa-pen"></i> Modifier</button>
                        <button type="button" class="btn btn-sm btn-danger" data-delete="${p._id}"><i class="fa-solid fa-trash"></i> Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    }

    function bindProductCardActions(card) {
        const editBtn = card.querySelector("[data-edit]");
        const deleteBtn = card.querySelector("[data-delete]");
        if (editBtn) editBtn.addEventListener("click", () => openModal(editBtn.dataset.edit));
        if (deleteBtn) deleteBtn.addEventListener("click", () => handleDelete(deleteBtn.dataset.delete));
    }

    function appendProductCard(p) {
        const grid = document.getElementById("productGrid");
        if (!grid) return;

        const scrollTop = saveScroll();
        if (!grid.querySelector(".product-card-admin")) {
            grid.innerHTML = "";
        }

        grid.insertAdjacentHTML("beforeend", buildProductCardHtml(p));
        const card = grid.querySelector(`.product-card-admin[data-id="${p._id}"]`);
        if (card) bindProductCardActions(card);
        restoreScroll(scrollTop);
    }

    function productMatchesFilters(p) {
        const search = document.getElementById("productSearch")?.value.trim().toLowerCase() || "";
        const category = document.getElementById("categoryFilter")?.value || "";
        const matchesSearch = !search || p.name.toLowerCase().includes(search);
        const matchesCategory = !category || (p.category || "").toLowerCase() === category;
        return matchesSearch && matchesCategory;
    }

    function bindModalEvents() {
        const modal = document.getElementById("productModal");
        if (!modal) return;

        const form = modal.querySelector("#productForm");
        const saveBtn = modal.querySelector("#submitProductForm");
        if (!form || !saveBtn) return;

        // Block native form navigation entirely (Enter key, accidental submit, etc.)
        form.setAttribute("action", "");
        form.removeAttribute("method");
        form.noValidate = true;
        form.onsubmit = (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveProduct();
            return false;
        };

        saveBtn.type = "button";
        saveBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveProduct();
        };
    }

    function ensureModal() {
        if (document.getElementById("productModal")) {
            bindModalEvents();
            return;
        }

        const modal = document.createElement("div");
        modal.id = "productModal";
        modal.className = "modal-overlay";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-head">
                    <h3 id="productModalTitle">Ajouter un produit</h3>
                    <button type="button" class="modal-close" id="closeProductModal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="productForm" class="modal-body" novalidate>
                    <input type="hidden" id="pf-id">

                    <div class="form-row">
                        <label>Nom du produit</label>
                        <input type="text" id="pf-name" required>
                    </div>

                    <div class="form-row form-row-split">
                        <div>
                            <label>Prix (${currency || "DA"})</label>
                            <input type="number" id="pf-price" min="0" required>
                        </div>
                        <div>
                            <label>Stock</label>
                            <input type="number" id="pf-stock" min="0" value="0" required>
                        </div>
                    </div>

                    <div class="form-row form-row-split">
                        <div>
                            <label>Catégorie</label>
                            <select id="pf-category">
                                <option value="homme">Homme</option>
                                <option value="femme">Femme</option>
                                <option value="enfant">Enfant</option>
                                <option value="accessoires">Accessoires</option>
                            </select>
                        </div>
                        <div class="featured-toggle">
                            <label><input type="checkbox" id="pf-featured"> Produit vedette</label>
                        </div>
                    </div>

                    <div class="form-row">
                        <label>Tailles disponibles</label>
                        <div class="size-checks">
                            ${SIZE_OPTIONS.map((s) => `<label class="size-check"><input type="checkbox" value="${s}" class="pf-size"> ${s}</label>`).join("")}
                        </div>
                    </div>

                    <div class="form-row">
                        <label>Description</label>
                        <textarea id="pf-description" rows="3" required></textarea>
                    </div>

                    <div class="form-row">
                        <label>Image</label>
                        <input type="file" id="pf-imageFile" accept="image/*">
                        <div id="pf-imagePreviewWrap" class="image-preview-wrap" hidden>
                            <img id="pf-imagePreview" alt="Aperçu">
                        </div>
                        <span id="pf-uploadStatus" class="muted"></span>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn" id="cancelProductForm">Annuler</button>
                        <button type="button" class="btn btn-primary" id="submitProductForm">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#closeProductModal").addEventListener("click", closeModal);
        modal.querySelector("#cancelProductForm").addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
        modal.querySelector("#pf-imageFile").addEventListener("change", handleImageUpload);

        bindModalEvents();
    }

    function openModal(id) {
        ensureModal();
        bindModalEvents();

        editingId = id || null;
        uploadedImageUrl = "";
        previousImageUrl = "";
        imageUploading = false;

        document.getElementById("productModalTitle").textContent = id ? "Modifier le produit" : "Ajouter un produit";
        document.getElementById("pf-id").value = id || "";
        document.getElementById("pf-uploadStatus").textContent = "";
        document.getElementById("pf-imagePreviewWrap").hidden = true;
        document.getElementById("productForm").reset();
        document.querySelectorAll(".pf-size").forEach((cb) => (cb.checked = false));

        if (id) {
            const p = products.find((x) => x._id === id);
            if (p) {
                document.getElementById("pf-name").value = p.name;
                document.getElementById("pf-price").value = p.price;
                document.getElementById("pf-stock").value = p.stock ?? 0;
                document.getElementById("pf-category").value = (p.category || "homme").toLowerCase();
                document.getElementById("pf-featured").checked = Boolean(p.isFeatured);
                document.getElementById("pf-description").value = p.description;
                (p.sizes || []).forEach((s) => {
                    const cb = [...document.querySelectorAll(".pf-size")].find((x) => x.value === s);
                    if (cb) cb.checked = true;
                });
                uploadedImageUrl = p.image || "";
                previousImageUrl = p.image || "";
                if (p.image) {
                    document.getElementById("pf-imagePreviewWrap").hidden = false;
                    document.getElementById("pf-imagePreview").src = resolveImageUrl(p.image);
                }
            }
        }

        document.getElementById("productModal").hidden = false;
    }

    function closeModal() {
        document.getElementById("productModal").hidden = true;
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const statusEl = document.getElementById("pf-uploadStatus");
        imageUploading = true;
        statusEl.textContent = "Envoi en cours...";
        try {
            const data = await Api.uploadImage(file);

            const newUrl =
                data.imageUrl ||
                data.image ||
                data.url ||
                "";
            if (!newUrl) throw new Error("Réponse serveur invalide");

            uploadedImageUrl = newUrl;
            statusEl.textContent = "✅ Image envoyée";
            document.getElementById("pf-imagePreviewWrap").hidden = false;
            document.getElementById("pf-imagePreview").src = resolveImageUrl(uploadedImageUrl);

            // When editing, update the grid card immediately — no save/reload needed.
            if (editingId) {
                updateProductCardImage(editingId, uploadedImageUrl);
            }
        } catch (err) {
            uploadedImageUrl = previousImageUrl;
            statusEl.textContent = "❌ " + err.message;
            e.target.value = "";
            if (previousImageUrl) {
                document.getElementById("pf-imagePreviewWrap").hidden = false;
                document.getElementById("pf-imagePreview").src = resolveImageUrl(previousImageUrl);
            }
        } finally {
            imageUploading = false;
        }
    }

    async function saveProduct() {
        if (imageUploading) {
            toast("Veuillez attendre la fin de l'envoi de l'image", "error");
            return;
        }

        if (!uploadedImageUrl) {
            toast("Merci d'ajouter une image pour le produit", "error");
            return;
        }

        const sizes = [...document.querySelectorAll(".pf-size:checked")].map((cb) => cb.value);

        const payload = {
            name: document.getElementById("pf-name").value.trim(),
            price: Number(document.getElementById("pf-price").value),
            stock: Number(document.getElementById("pf-stock").value),
            category: document.getElementById("pf-category").value,
            isFeatured: document.getElementById("pf-featured").checked,
            sizes,
            description: document.getElementById("pf-description").value.trim(),
            image: uploadedImageUrl,
        };

        const submitBtn = document.getElementById("submitProductForm");
        const scrollTop = saveScroll();
        submitBtn.disabled = true;
        submitBtn.textContent = "Enregistrement...";

        try {
            if (editingId) {
                const saved = await Api.updateProduct(editingId, payload);
                updateProductInGrid(saved);
                toast("Produit modifié avec succès");
            } else {
                const saved = await Api.createProduct(payload);
                products.push(saved);
                if (productMatchesFilters(saved)) {
                    appendProductCard(saved);
                }
                toast("Produit ajouté avec succès");
            }
            closeModal();
            restoreScroll(scrollTop);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enregistrer";
        }
    }

    function updateProductCardImage(productId, imagePath) {
        const card = document.querySelector(`.product-card-admin[data-id="${productId}"]`);
        if (!card) return;

        const img = card.querySelector("img");
        if (!img) return;

        const resolved = resolveImageUrl(imagePath);
        img.src = resolved;
        img.onerror = function () {
            this.src = "https://placehold.co/400x500?text=No+Image";
        };

        const idx = products.findIndex((p) => String(p._id) === String(productId));
        if (idx !== -1) products[idx].image = imagePath;
    }

    function updateProductInGrid(updated) {
        const id = String(updated._id);
        const idx = products.findIndex((p) => String(p._id) === id);
        if (idx !== -1) products[idx] = updated;

        const card = document.querySelector(`.product-card-admin[data-id="${id}"]`);
        if (!card) return;

        const img = card.querySelector("img");
        if (img) {
            img.src = resolveImageUrl(updated.image);
            img.alt = updated.name;
        }

        const nameEl = card.querySelector("h4");
        if (nameEl) nameEl.textContent = updated.name;

        const priceEl = card.querySelector(".price-tag");
        if (priceEl) priceEl.textContent = formatMoney(updated.price, currency);

        const descEl = card.querySelector(".line-clamp");
        if (descEl) descEl.textContent = updated.description;

        const chipRow = card.querySelector(".chip-row");
        if (chipRow) {
            chipRow.innerHTML = `
                <span class="chip">${escapeHtml(updated.category || "Non classé")}</span>
                <span class="chip ${updated.stock <= 5 ? "chip-warn" : ""}">Stock: ${updated.stock ?? 0}</span>
                ${(updated.sizes || []).map((s) => `<span class="chip chip-size">${escapeHtml(s)}</span>`).join("")}
            `;
        }
    }

    return { mount };
})();
