/* ============================================================
   FOUAD SHOP — PRODUCT DETAIL PAGE
   Reads ?product=<mongoId> and fetches the real product from the API.
   Cart logic (orderProduct, renderCart, resolveImageUrl) comes from
   script.js, loaded before this file.
   ============================================================ */

let selectedSize = "";

async function loadProduct(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get("product");

    if(!id){
        showNotFound();
        return;
    }

    try{
        const res = await fetch(`${API_BASE}/products/${id}`);
        if(!res.ok){
            showNotFound();
            return;
        }
        const product = await res.json();
        renderProduct(product);
    }catch(e){
        showNotFound();
    }
}

function renderProduct(product){
    document.getElementById("product-title").textContent = product.name;
    document.getElementById("product-category").textContent = product.category || "";
    document.getElementById("product-description").textContent = product.description;
    document.getElementById("product-image").src = resolveImageUrl(product.image);
    document.getElementById("product-image").alt = product.name;
    document.getElementById("product-image").onerror = function () {
        this.src = "https://placehold.co/400x500?text=No+Image";
    };
    document.getElementById("breadcrumb-current").textContent = product.name;
    document.title = `Fouad Shop — ${product.name}`;

    document.getElementById("product-price").innerHTML = `${product.price} ${CURRENCY}`;

    const stockEl = document.getElementById("product-stock");
    const outOfStock = (product.stock ?? 0) <= 0;
    stockEl.textContent = outOfStock ? "Rupture de stock" : `En stock (${product.stock} disponible${product.stock > 1 ? "s" : ""})`;
    stockEl.className = "stock-status" + (outOfStock ? " out-of-stock" : "");

    const sizeWrapper = document.getElementById("sizeWrapper");
    const sizeOptions = document.getElementById("sizeOptions");
    if(product.sizes && product.sizes.length){
        sizeOptions.innerHTML = product.sizes.map((s, i) =>
            `<button class="size-btn ${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`
        ).join("");
        selectedSize = product.sizes[0];
        sizeOptions.querySelectorAll(".size-btn").forEach(btn => {
            btn.addEventListener("click", () => selectSize(btn));
        });
    }else{
        sizeWrapper.style.display = "none";
    }

    const addBtn = document.getElementById("addToCartBtn");
    if(outOfStock){
        addBtn.disabled = true;
        addBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Indisponible`;
    }else{
        addBtn.addEventListener("click", function(){
            const activeBtn = document.querySelector(".size-btn.active");
            const chosenSize = activeBtn ? activeBtn.dataset.size : selectedSize;
            orderProduct(product, chosenSize);
            const originalHTML = this.innerHTML;
            this.innerHTML = `<i class="fa-solid fa-check"></i> Ajouté au panier`;
            setTimeout(() => { this.innerHTML = originalHTML; }, 1500);
        });
    }
}

function selectSize(btn){
    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedSize = btn.dataset.size;
}

function showNotFound(){
    document.querySelector(".product-details").innerHTML =
        `<p style="padding:60px 0;">Produit introuvable. <a href="index.html">Retour à la boutique</a></p>`;
}

(async function init(){
    await loadSettings();
    renderCart();
    await loadProduct();
})();
