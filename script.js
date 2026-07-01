/* ============================================================
   FOUAD SHOP — SCRIPT
   1. Cart (persisted in localStorage, shared with product.html)
   2. Search
   3. Filters
   4. Hero slider
   5. Countdown
   6. Mobile menu
   7. Order via WhatsApp
   ============================================================ */

const CART_KEY = "fs_cart";
const WHATSAPP_NUMBER = "213669432393";

/* ---------- 1. Cart ---------- */
let cart = loadCart();

function loadCart(){
    try{
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    }catch(e){
        return [];
    }
}

function saveCart(){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartTotal(){
    return cart.reduce((sum, item) => sum + item.price, 0);
}

function orderProduct(name, price){
    cart.push({ name, price });
    saveCart();
    renderCart();
}

function removeProduct(index){
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function renderCart(){
    const countEl = document.getElementById("cart-count");
    if(countEl) countEl.textContent = cart.length;

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
                <span>${item.name} — ${item.price} DA</span>
                <button onclick="removeProduct(${index})" aria-label="Retirer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            list.appendChild(li);
        });
    }

    totalEl.textContent = "Total : " + cartTotal() + " DA";
}

/* ---------- 2. Search ---------- */
function searchProducts(){
    const input = document.getElementById("searchInput");
    if(!input) return;

    const query = input.value.trim().toLowerCase();
    const cards = document.querySelectorAll(".card");
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const match = title.includes(query);
        card.style.display = match ? "flex" : "none";
        if(match) visibleCount++;
    });

    const emptyState = document.getElementById("emptyState");
    if(emptyState) emptyState.style.display = visibleCount === 0 ? "block" : "none";

    resetFilterButtons();
}

/* ---------- 3. Filters ---------- */
function filterProducts(category, btn){
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const show = category === "all" || card.dataset.category === category;
        card.style.display = show ? "flex" : "none";
    });

    const emptyState = document.getElementById("emptyState");
    if(emptyState) emptyState.style.display = "none";

    const activeBtn = btn || document.querySelector(`.filter-btn[data-filter="${category}"]`);
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if(activeBtn) activeBtn.classList.add("active");

    const searchInput = document.getElementById("searchInput");
    if(searchInput) searchInput.value = "";
}

function resetFilterButtons(){
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if(allBtn) allBtn.classList.add("active");
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

/* ---------- 7. Order via WhatsApp ---------- */
function sendOrder(){
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const wilaya = document.getElementById("customerWilaya").value;
    const address = document.getElementById("customerAddress").value.trim();

    if(!name || !phone){
        alert("Merci de remplir votre nom et votre téléphone.");
        return;
    }

    if(cart.length === 0){
        alert("Votre panier est vide. Ajoutez un produit avant de commander.");
        return;
    }

    let message = "🛍️ Nouvelle commande - Fouad Shop\n\n";
    message += `👤 Nom: ${name}\n`;
    message += `📞 Téléphone: ${phone}\n`;
    message += `📍 Wilaya: ${wilaya}\n`;
    message += `🏠 Adresse: ${address}\n\n`;
    message += "🛒 Produits:\n";

    cart.forEach(item => {
        message += `- ${item.name} : ${item.price} DA\n`;
    });

    message += `\n💰 Total: ${cartTotal()} DA`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

/* ---------- Init ---------- */
renderCart();
