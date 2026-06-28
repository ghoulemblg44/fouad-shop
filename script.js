let cart = [];
let total = 0;

function orderProduct(name, price){

    cart.push({name, price});

    total += price;

    document.getElementById("cart-count").innerText =
    "🛒 " + cart.length;

    updateCart();
}

function updateCart(){

    let list = document.getElementById("cart-items");

    list.innerHTML = "";

    cart.forEach((product,index) => {

        let li = document.createElement("li");

        li.innerHTML = `
            ${product.name} - ${product.price} DA
            <button onclick="removeProduct(${index})">
                ❌
            </button>
        `;

        list.appendChild(li);

    });

    document.getElementById("total").innerText =
    "Total : " + total + " DA";
}

function removeProduct(index){

    total -= cart[index].price;

    cart.splice(index,1);

    document.getElementById("cart-count").innerText =
    "🛒 " + cart.length;

    updateCart();
}

let time = 86400;

setInterval(() => {

    let hours = Math.floor(time / 3600);

    let minutes = Math.floor((time % 3600) / 60);

    let seconds = time % 60;

    document.getElementById("timer").textContent =
        `${hours.toString().padStart(2,'0')}:` +
        `${minutes.toString().padStart(2,'0')}:` +
        `${seconds.toString().padStart(2,'0')}`;

    if(time > 0){
        time--;
    }

},1000);

function filterProducts(category){

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        if(category === "all"){

            card.style.display = "block";

        }else if(card.dataset.category === category){

            card.style.display = "block";

        }else{

            card.style.display = "none";

        }

    });

}

const slides = document.querySelectorAll(".slide");

let currentSlide = 0;

setInterval(() => {

    slides[currentSlide].classList.remove("active");

    currentSlide++;

    if(currentSlide >= slides.length){

        currentSlide = 0;

    }

    slides[currentSlide].classList.add("active");

},4000);