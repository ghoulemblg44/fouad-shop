/* ============================================================
   FOUAD SHOP — PRODUCT PAGE
   Reads ?product=<id> and fills the detail view.
   Cart logic (orderProduct, renderCart) comes from script.js,
   loaded before this file.
   ============================================================ */

const products = {
    tshirt: {
        title: "Oversize Black T-Shirt",
        category: "Homme",
        price: 2500,
        oldPrice: 3200,
        image: "tshirt.jpg",
        description: "T-shirt premium en coton épais, coupe oversize pour un look décontracté et streetwear. Confortable et résistant au lavage."
    },
    hoodie: {
        title: "Urban Hoodie",
        category: "Homme",
        price: 4500,
        oldPrice: null,
        image: "hoodie.jpg",
        description: "Hoodie en molleton chaud et confortable, capuche doublée et poche kangourou. Idéal pour les journées fraîches."
    },
    jean: {
        title: "Slim Fit Jeans",
        category: "Homme",
        price: 3500,
        oldPrice: 4000,
        image: "jean.jpg",
        description: "Jean slim en denim extensible, coupe moderne et élégante qui garde sa forme tout au long de la journée."
    }
};

const params = new URLSearchParams(window.location.search);
const id = params.get("product");
const product = products[id];

if(product){
    document.getElementById("product-title").textContent = product.title;
    document.getElementById("product-category").textContent = product.category;
    document.getElementById("product-description").textContent = product.description;
    document.getElementById("product-image").src = product.image;
    document.getElementById("product-image").alt = product.title;
    document.getElementById("breadcrumb-current").textContent = product.title;
    document.title = `Fouad Shop — ${product.title}`;

    const priceEl = document.getElementById("product-price");
    priceEl.innerHTML = product.oldPrice
        ? `<span class="old-price">${product.oldPrice} DA</span> ${product.price} DA`
        : `${product.price} DA`;

    document.getElementById("addToCartBtn").addEventListener("click", function(){
        orderProduct(product.title, product.price);

        const originalHTML = this.innerHTML;
        this.innerHTML = `<i class="fa-solid fa-check"></i> Ajouté au panier`;
        setTimeout(() => { this.innerHTML = originalHTML; }, 1500);
    });
}else{
    document.querySelector(".product-details").innerHTML =
        `<p style="padding:60px 0;">Produit introuvable. <a href="index.html">Retour à la boutique</a></p>`;
}

function selectSize(btn){
    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}
