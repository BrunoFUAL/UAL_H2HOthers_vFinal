let carts = document.querySelectorAll(".add-cart");
let stage = 'dev';
let products = [];

async function getProducts() {
  const host = stage === 'dev' ? 'http://localhost:5000' : 'https://h2hothers.herokuapp.com';
  const response = await axios.get(`${host}/products`);
  console.log(response.data);
  products = response.data.products;

  populateProducts();
}

getProducts();

function populateProducts() {
  const container = document.querySelector('.container_2');

  const productsHtml = products.map((product, i) => {
    return (
        `
        <div class="image">
          <img src="${product.image}" alt="${product.description}">
          <h3>${product.name}</h3>
          <h3>€${product.price}</h3>
          <a class="add-cart cart${i+1}" href="#">Adicionar ao Carrinho</a>
        </div>
        `
    )
  })

  if(container) {
    container.innerHTML += productsHtml.toString().replaceAll(',', '');
    addCartActions()
  }
}

function addCartActions() {
const hoverProducts = document.getElementsByClassName('image');
let carts = document.querySelectorAll('.add-cart');

for(let i=0; i < hoverProducts.length; i++) {
  hoverProducts[i].addEventListener('mouseover', () => {
    carts[i].classList.add('showAddCart');
  })

  hoverProducts[i].addEventListener('mouseout', () => {
    carts[i].classList.remove('showAddCart');
  })
}

for(let i=0; i < carts.length; i++) {
  carts[i].addEventListener('click', () => {
    cartNumbers(products[i]);
    totalCost(products[i]);
  })
}
}

for (let i = 0; i < carts.length; i++) {
  carts[i].addEventListener("click", () => {
    cartNumbers(products[i]);
    totalCost(products[i]);
  });
}

function onLoadCartNumbers() {
  let productNumbers = localStorage.getItem("cartNumbers");

  if (productNumbers) {
    document.querySelector("span").textContent = productNumbers;
  }
}

function cartNumbers(product, action) {
  let productNumbers = localStorage.getItem("cartNumbers");
  productNumbers = parseInt(productNumbers);

  let cartItems = localStorage.getItem("productsInCart");
  cartItems = JSON.parse(cartItems);

  if (action == "decrease") {
    localStorage.setItem("cartNumbers", productNumbers - 1);
    document.querySelector("span").textContent = productNumbers - 1;
  } else if (productNumbers) {
    localStorage.setItem("cartNumbers", productNumbers + 1);
    document.querySelector("span").textContent = productNumbers + 1;
  } else {
    localStorage.setItem("cartNumbers", 1);
    document.querySelector("span").textContent = 1;
  }

  setItems(product);
}

function setItems(product) {
  let cartItems = localStorage.getItem("productsInCart");
  cartItems = JSON.parse(cartItems);

  if (cartItems != null) {
    if (cartItems[product.tag] == undefined) {
      cartItems = {
        ...cartItems,
        [product.tag]: product,
      };
    }
    cartItems[product.tag].inCart += 1;
  } else {
    product.inCart = 1;
    cartItems = {
      [product.tag]: product,
    };
  }
  localStorage.setItem("productsInCart", JSON.stringify(cartItems));
}

function totalCost(product, action) {
  let cartCost = localStorage.getItem("totalCost");

  console.log("My cartCost is", cartCost);
  console.log(typeof cartCost);
  if (action == "decrease") {
    cartCost = parseInt(cartCost);

    localStorage.setItem("totalCost", cartCost - product.price);
  } else if (cartCost != null) {
    cartCost = parseInt(cartCost);
    localStorage.setItem("totalCost", cartCost + product.price);
  } else {
    localStorage.setItem("totalCost", product.price);
  }
}

function displayCart() {
  let cartItems = localStorage.getItem("productsInCart");
  cartItems = JSON.parse(cartItems);
  let productContainer = document.querySelector(".products");
  let cartCost = localStorage.getItem("totalCost");
  if (cartItems && productContainer) {
    productContainer.innerHTML = "";
    Object.values(cartItems).map((item) => {
      productContainer.innerHTML += `
            <div class="product">
                <ion-icon name="close-circle"></ion-icon>
                <img src="./images/${item.tag}.png">
                <span>${item.name}</span>
                </div>
                <div class="price">€${item.price},00</div>
                <div class="quantity">
                <ion-icon class="decrease" name="remove-circle"></ion-icon>
                <span>${item.inCart}</span>
                <ion-icon class="increase" name="add-circle"></ion-icon>
                </div>
                <div class="total">
                    €${item.inCart * item.price},00
                </div>
            `;
    });
    productContainer.innerHTML += `
            <div class="basketTotalContainer">
                <h4 class=basketTotalTitle>
                Total no Carrinho </h4>
                <h4 class"basketTotal">
                €${cartCost},00
                </h4>
        `;
  }
  deleteButtons();
  manageQuantity();
}

function deleteButtons() {
  let deleteButtons = document.querySelectorAll(".product ion-icon");
  let productName;
  let productNumbers = localStorage.getItem("cartNumbers");
  let cartItems = localStorage.getItem("productsInCart");
  cartItems = JSON.parse(cartItems);
  let cartCost = localStorage.getItem("totalCost");

  for (let i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener("click", () => {
      productName = deleteButtons[i].parentElement.textContent
        .trim()
        .toLowerCase()
        .replace(/ /g, "");
      localStorage.setItem(
        "cartNumbers",
        productNumbers - cartItems[productName].inCart
      );

      localStorage.setItem(
        "totalCost",
        cartCost - cartItems[productName].price * cartItems[productName].inCart
      );

      delete cartItems[productName];
      localStorage.setItem("productsInCart", JSON.stringify(cartItems));

      displayCart();
      onLoadCartNumbers();
    });
  }
}

function manageQuantity() {
  let decreaseButtons = document.querySelectorAll(".decrease");
  let increaseButtons = document.querySelectorAll(".increase");
  let cartItems = localStorage.getItem("productsInCart");
  let currentQuantity = 0;
  let currentProduct = "";
  cartItems = JSON.parse(cartItems);
  console.log(cartItems);

  for (let i = 0; i < decreaseButtons.length; i++) {
    decreaseButtons[i].addEventListener("click", () => {
      currentQuantity =
        decreaseButtons[i].parentElement.querySelector("span").textContent;
      console.log(currentQuantity);
      currentProduct = decreaseButtons[
        i
      ].parentElement.previousElementSibling.previousElementSibling
        .querySelector("span")
        .textContent.toLowerCase()
        .replace(/ /g, "")
        .trim();
      console.log(currentProduct);

      if (cartItems[currentProduct].inCart > 1) {
        cartItems[currentProduct].inCart -= 1;
        cartNumbers(cartItems[currentProduct], "decrease");
        totalCost(cartItems[currentProduct], "decrease");
        localStorage.setItem("productsInCart", JSON.stringify(cartItems));
        displayCart();
      }
    });
  }

  for (let i = 0; i < increaseButtons.length; i++) {
    increaseButtons[i].addEventListener("click", () => {
      console.log("Increase button");
      currentQuantity =
        increaseButtons[i].parentElement.querySelector("span").textContent;
      console.log(currentQuantity);

      currentProduct = increaseButtons[
        i
      ].parentElement.previousElementSibling.previousElementSibling
        .querySelector("span")
        .textContent.toLowerCase()
        .replace(/ /g, "")
        .trim();
      console.log(currentProduct);

      cartItems[currentProduct].inCart += 1;
      cartNumbers(cartItems[currentProduct]);
      totalCost(cartItems[currentProduct]);
      localStorage.setItem("productsInCart", JSON.stringify(cartItems));
      displayCart();
    });
  }
}

onLoadCartNumbers();
displayCart();

function loadComments() {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("comments").innerHTML = "";
      var result = this.responseText;
      var results = JSON.parse(result);

      results.forEach((comment) => {
        var node = document.createElement("ARTICLE");
        var name = document.createElement("div");
        var date = document.createElement("h6");
        var message = document.createElement("p");

        node.className = "swiper-slide";
        name.className = "voluntario";
        date.className = "card-subtitle text-muted";

        var textName = document.createTextNode(comment.userName);
        var textDate = document.createTextNode(comment.date);
        var textMessage = document.createTextNode(comment.comment);

        name.appendChild(textName);
        date.appendChild(textDate);
        message.appendChild(textMessage);

        node.appendChild(name);
        node.appendChild(date);
        node.appendChild(message);

        document.getElementById("comments").appendChild(node);
      });
    }
  };
  xhttp.open("GET", "/home", true);
  xhttp.send();
}

function inserirComentario() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var result = this.responseText;
      console.log(result);
      loadComments();
    }
  };

  var name = document.getElementById("name").value;
  var message = document.getElementById("message").value;

  xhttp.open("POST", "/insert", true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send('{"name":"' + name + '", "message":"' + message + '"}');
}
