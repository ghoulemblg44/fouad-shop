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