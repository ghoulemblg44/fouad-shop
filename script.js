/* ============================================================
   FOUAD SHOP — SCRIPT
   1. Config & settings
   2. Cart (persisted in localStorage, shared with product.html)
   3. Product loading, search, filters, sort, price range
   4. Hero slider
   5. Countdown
   6. Mobile menu
   7. Checkout (saved directly to MongoDB, with an on-screen confirmation)
   ============================================================ */

const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://localhost:5000/api"
    : "https://fouad-shop.onrender.com/api";
const ORIGIN_BASE = API_BASE.replace(/\/api$/, "");

const CART_KEY = "fs_cart";
let CURRENCY = "DA";
let DELIVERY_PRICE = 0;

let allProducts = [];
let currentCategory = "all";
let currentSearch = "";

/* ---------- Helpers ---------- */
function resolveImageUrl(image){
    if(!image) return "https://placehold.co/400x500?text=No+Image";

    let img = String(image).trim().replace(/\\/g, "/");
    if(!img) return "https://placehold.co/400x500?text=No+Image";

    // Cloudinary / any absolute URL -> use as-is.
    if(/^https?:\/\//i.test(img)) return img;

    // New uploads stored on the backend, e.g. "/uploads/xyz.jpg" or
    // "uploads/xyz.jpg" -> prefix with the API origin.
    if(/^\/?uploads\//i.test(img)) return ORIGIN_BASE + "/" + img.replace(/^\/+/, "");

    // Old products: DB may store either a bare filename ("hoodie.jpg")
    // or a path that already includes the folder ("images/hoodie.jpg",
    // "/images/hoodie.jpg"). Normalize both to a single "images/..." path
    // so we never end up requesting "images/images/hoodie.jpg" (which
    // 404s and was showing "No Image" for perfectly valid old products).
    img = img.replace(/^\/+/, "").replace(/^images\//i, "");
    return `images/${encodeURI(img)}`;
}

async function loadSettings(){
    try{
        const res = await fetch(`${API_BASE}/settings`);
        if(!res.ok) return;
        const settings = await res.json();
        CURRENCY = settings.currency || CURRENCY;
        DELIVERY_PRICE = settings.deliveryPrice || 0;

        const storeNameEls = document.querySelectorAll(".logo-text");
        if(settings.storeName){
            document.title = document.title.replace(/^[^—]+/, settings.storeName + " ");
        }
    }catch(e){
        console.warn("Could not load store settings, using defaults.", e);
    }
}

/* ---------- 2. Cart ---------- */
let cart = loadCart();

function loadCart(){
    try{
        const items = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        return items.map(item => ({
            ...item,
            size: item.size != null ? String(item.size).trim() : "",
        }));
    }catch(e){
        return [];
    }
}

function saveCart(){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartTotal(){
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function orderProduct(product, size){
    const productId = product._id || product.id || null;
    const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
    const resolvedSize = productSizes.length ? String(size || "").trim() : "";

    if(productSizes.length && !resolvedSize){
        alert(`Veuillez sélectionner une taille pour ${product.name}.`);
        return;
    }

    const existing = cart.find(item => item.productId === productId && item.size === resolvedSize);
    if(existing){
        existing.quantity += 1;
    }else{
        cart.push({
            productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: resolvedSize,
            availableSizes: productSizes,
            image: product.image || "",
        });
    }
    saveCart();
    renderCart();
}

function removeProduct(index){
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function changeQuantity(index, delta){
    const item = cart[index];
    if(!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart();
    renderCart();
}

function renderCart(){
    const countEl = document.getElementById("cart-count");
    if(countEl) countEl.textContent = cart.reduce((n, i) => n + i.quantity, 0);

    const list = document.getElementById("cart-items");
    const totalEl = document.getElementById("total");
    if(!list || !totalEl) return;

    list.innerHTML = "";

    if(cart.length === 0){
        list.innerHTML = `<li class="cart-empty">Votre panier est vide pour le moment.</li>`;
    }else{
        cart.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.name}${item.size ? ` (${item.size})` : ""} — ${item.price} ${CURRENCY}
                    <span class="qty-controls">
                        <button onclick="changeQuantity(${index},-1)" aria-label="Diminuer">−</button>
                        <b>${item.quantity}</b>
                        <button onclick="changeQuantity(${index},1)" aria-label="Augmenter">+</button>
                    </span>
                </span>
                <button onclick="removeProduct(${index})" aria-label="Retirer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            list.appendChild(li);
        });
    }

    totalEl.textContent = "Total : " + cartTotal() + " " + CURRENCY;
    renderDeliverySummary();
}

function renderDeliverySummary(){
    const el = document.getElementById("orderDeliverySummary");
    if(!el) return;
    if(cart.length === 0){
        el.innerHTML = "";
        return;
    }
    const grandTotal = cartTotal() + DELIVERY_PRICE;
    el.innerHTML = `
        <div class="delivery-row"><span>Sous-total</span><span>${cartTotal()} ${CURRENCY}</span></div>
        <div class="delivery-row"><span>Livraison</span><span>${DELIVERY_PRICE} ${CURRENCY}</span></div>
        <div class="delivery-row delivery-row-total"><span>Total</span><span>${grandTotal} ${CURRENCY}</span></div>
    `;
}

/* ---------- 3. Search / filters / sort ---------- */
function searchProducts(){
    const input = document.getElementById("searchInput");
    currentSearch = input ? input.value.trim().toLowerCase() : "";
    renderFilteredProducts();
}

function filterProducts(category, btn){
    currentCategory = category;

    const activeBtn = btn || document.querySelector(`.filter-btn[data-filter="${category}"]`);
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if(activeBtn) activeBtn.classList.add("active");

    renderFilteredProducts();
}

function applySortAndPrice(){
    renderFilteredProducts();
}

function renderFilteredProducts(){
    const minPrice = parseFloat(document.getElementById("minPrice")?.value) || 0;
    const maxPrice = parseFloat(document.getElementById("maxPrice")?.value) || Infinity;
    const sortMode = document.getElementById("sortSelect")?.value || "newest";

    let list = allProducts.filter(p => {
        const matchesCategory =
            currentCategory === "all" ? true :
            currentCategory === "featured" ? Boolean(p.isFeatured) :
            (p.category || "").toLowerCase() === currentCategory;

        const matchesSearch = !currentSearch || p.name.toLowerCase().includes(currentSearch);
        const matchesPrice = p.price >= minPrice && p.price <= maxPrice;

        return matchesCategory && matchesSearch && matchesPrice;
    });

    if(sortMode === "price-asc") list = list.sort((a,b) => a.price - b.price);
    else if(sortMode === "price-desc") list = list.sort((a,b) => b.price - a.price);
    else list = list.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    renderProductGrid(list);
}

function renderProductGrid(products){
    const grid = document.getElementById("product-grid");
    const emptyState = document.getElementById("emptyState");
    if(!grid) return;

    grid.innerHTML = "";

    if(products.length === 0){
        if(emptyState) emptyState.style.display = "block";
        return;
    }
    if(emptyState) emptyState.style.display = "none";

    products.forEach(product => {
        const outOfStock = (product.stock ?? 0) <= 0;
        const sizes = product.sizes && product.sizes.length ? product.sizes : [];
        const sizeOptions = sizes.map(s => `<option value="${s}">${s}</option>`).join("");

        const card = document.createElement("article");
        card.className = "card";
        card.dataset.category = (product.category || "").toLowerCase();
        card.innerHTML = `
            <div class="card-media">
                ${product.isFeatured ? `<span class="card-badge">★ Vedette</span>` : ""}
                ${outOfStock ? `<span class="card-badge card-badge-stock">Rupture de stock</span>` : ""}
                <a href="product.html?product=${product._id}">
                    <img src="${resolveImageUrl(product.image)}" alt="${product.name}" onerror="this.src='https://placehold.co/400x500?text=No+Image'">
                </a>
            </div>

            <div class="card-body">
                <a href="product.html?product=${product._id}" class="card-title-link"><h3>${product.name}</h3></a>
                <p>${product.description}</p>

                ${sizes.length ? `
                    <label class="card-size-label">
                        Taille
                        <select class="card-size-select">${sizeOptions}</select>
                    </label>
                ` : ""}

                <div class="card-price">
                    <span class="new-price">${product.price} ${CURRENCY}</span>
                </div>

                <button class="btn btn-add" ${outOfStock ? "disabled" : ""}>
                    ${outOfStock ? "Indisponible" : "Ajouter au panier"}
                </button>
            </div>
        `;

        if(!outOfStock){
            card.querySelector(".btn-add").addEventListener("click", () => {
                const sizeSelect = card.querySelector(".card-size-select");
                const chosenSize = sizeSelect ? sizeSelect.value : "";
                orderProduct(product, chosenSize);
            });
        }

        grid.appendChild(card);
    });
}

/* ---------- 4. Hero slider ---------- */
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
let currentSlide = 0;
let sliderInterval;

function showSlide(index){
    slides.forEach(s => s.classList.remove("active"));
    dots.forEach(d => d.classList.remove("active"));

    slides[index].classList.add("active");
    if(dots[index]) dots[index].classList.add("active");

    currentSlide = index;
}

function goToSlide(index){
    showSlide(index);
    restartSlider();
}

function nextSlide(){
    showSlide((currentSlide + 1) % slides.length);
}

function restartSlider(){
    clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 4500);
}

if(slides.length){
    restartSlider();
}

/* ---------- 5. Countdown ---------- */
const timerEl = document.getElementById("timer");

if(timerEl){
    let time = 86400;

    setInterval(() => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        timerEl.textContent =
            `${hours.toString().padStart(2,'0')}:` +
            `${minutes.toString().padStart(2,'0')}:` +
            `${seconds.toString().padStart(2,'0')}`;

        if(time > 0) time--;
    }, 1000);
}

/* ---------- 6. Mobile menu ---------- */
function toggleMenu(){
    const menu = document.getElementById("navMenu");
    if(menu) menu.classList.toggle("open");
}

/* ---------- 7. Checkout ---------- */
async function sendOrder(){
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const wilaya = document.getElementById("customerWilaya").value;
    const address = document.getElementById("customerAddress").value.trim();
    const deliveryNotes = document.getElementById("customerNotes")?.value.trim() || "";
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

    if(!name || !phone || !address){
        alert("Merci de remplir votre nom, votre téléphone et votre adresse.");
        return;
    }

    if(cart.length === 0){
        alert("Votre panier est vide. Ajoutez un produit avant de commander.");
        return;
    }

    for(const item of cart){
        let needsSize = Array.isArray(item.availableSizes) && item.availableSizes.length > 0;
        if(!needsSize && item.productId && allProducts.length){
            const match = allProducts.find(p => String(p._id) === String(item.productId));
            if(match?.sizes?.length) needsSize = true;
        }
        const itemSize = String(item.size || "").trim();
        if(needsSize && !itemSize){
            alert(`Veuillez sélectionner une taille pour ${item.name} avant de commander.`);
            return;
        }
    }

    const btn = document.getElementById("sendOrderBtn");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Envoi en cours...`;

    const customer = { name, phone, wilaya, address };
    const items = cart.map(item => ({
        product: item.productId || undefined,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: String(item.size || "").trim(),
        image: item.image || "",
    }));

    try{
        const res = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customer, items, deliveryNotes, paymentMethod }),
        });
        const data = await res.json();

        if(!res.ok){
            throw new Error(data.message || "Une erreur est survenue.");
        }

        showOrderSuccess(data.order, name);

        cart = [];
        saveCart();
        renderCart();
        document.getElementById("customerName").value = "";
        document.getElementById("customerPhone").value = "";
        document.getElementById("customerAddress").value = "";
        if(document.getElementById("customerNotes")) document.getElementById("customerNotes").value = "";
    }catch(e){
        console.warn("Could not save order:", e);
        alert("Votre commande n'a pas pu être enregistrée. Merci de réessayer dans un instant.");
    }finally{
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

/* Beautiful order confirmation (replaces the old WhatsApp redirect + alert) */
function showOrderSuccess(order, name){
    const overlay = document.getElementById("orderSuccessOverlay");
    if(!overlay){
        alert(`Merci ${name} ! Votre commande a été enregistrée.`);
        return;
    }

    const orderNumber = order?._id ? `#${String(order._id).slice(-6).toUpperCase()}` : "";
    const total = order?.totalPrice ?? (cartTotal() + DELIVERY_PRICE);

    document.getElementById("orderSuccessName").textContent = name;
    document.getElementById("orderSuccessMeta").textContent =
        orderNumber ? `Commande ${orderNumber} — ${total} ${CURRENCY}` : `${total} ${CURRENCY}`;

    overlay.classList.add("show");
    document.body.classList.add("no-scroll");
}

function closeOrderSuccess(){
    const overlay = document.getElementById("orderSuccessOverlay");
    if(overlay) overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
}

/* ---------- Init ---------- */
async function loadProducts() {
    try{
        const res = await fetch(`${API_BASE}/products`);
        allProducts = await res.json();
        renderFilteredProducts();
    }catch(e){
        console.error("Could not load products:", e);
    }
}

(async function init(){
    await loadSettings();
    renderCart();
    await loadProducts();
})();
