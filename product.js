const products = {
    tshirt: {
        title: "Oversize Black T-Shirt",
        price: "2500 DA",
        image: "tshirt.jpg",
        description: "T-shirt premium en coton."
    },

    hoodie: {
        title: "Urban Hoodie",
        price: "4500 DA",
        image: "hoodie.jpg",
        description: "Hoodie chaud et confortable."
    },

    jean: {
        title: "Slim Fit Jeans",
        price: "3500 DA",
        image: "jean.jpg",
        description: "Jean moderne et élégant."
    }
};

const params = new URLSearchParams(window.location.search);
const id = params.get("product");

const product = products[id];

if(product){

    document.getElementById("product-title").textContent = product.title;

    document.getElementById("product-price").textContent = product.price;

    document.getElementById("product-description").textContent = product.description;

    document.getElementById("product-image").src = product.image;

}