const venue = {
  currency: "AZN",
  rows: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
  seatsPerRow: 16,
  categories: [
    { name: "Economy", rows: ["A", "B"], price: 5, className: "economy" },
    { name: "Standard", rows: ["C", "D", "E", "F", "G"], price: 8, className: "standard" },
    { name: "VIP", rows: ["H", "I", "J"], price: 18, className: "vip" }
  ],
  unavailableSeatIds: [
    "A3", "A12", "B7", "B15", "C2", "C10", "D6", "E14",
    "F4", "F13", "G8", "H2", "H11", "I6", "J9", "J16"
  ]
};

const STORAGE_KEY = "seatlyCart";
const seatMap = document.querySelector("#seat-map");
const venueMap = document.querySelector("#venue-map");
const mapControls = document.querySelector(".map-controls");
const viewStatus = document.querySelector("#view-status");
const availableCount = document.querySelector("#available-count");
const seatTitle = document.querySelector("#seat-title");
const seatDetails = document.querySelector("#seat-details");
const addToCartButton = document.querySelector("#add-to-cart");
const seatMessage = document.querySelector("#seat-message");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");

const state = {
  seats: [],
  inspectedSeatId: null,
  cart: [],
  view: createDefaultView()
};

function createDefaultView() {
  return {
    scale: window.innerWidth < 700 ? 0.72 : 1,
    x: 0,
    y: 0
  };
}

function getCategoryForRow(row) {
  return venue.categories.find((category) => category.rows.includes(row));
}

function createVenueSeats() {
  const seats = [];

  venue.rows.forEach((row) => {
    const category = getCategoryForRow(row);

    for (let number = 1; number <= venue.seatsPerRow; number += 1) {
      const id = `${row}${number}`;
      seats.push({
        id,
        row,
        number,
        category: category.name,
        categoryClass: category.className,
        price: category.price,
        unavailable: venue.unavailableSeatIds.includes(id)
      });
    }
  });

  return seats;
}

function getSeatById(seatId) {
  return state.seats.find((seat) => seat.id === seatId);
}

function isSeatInCart(seatId) {
  return state.cart.some((ticket) => ticket.id === seatId);
}

function createSeatButton(seat) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `seat ${seat.categoryClass}`;
  button.dataset.seatId = seat.id;
  button.textContent = seat.number;
  button.setAttribute(
    "aria-label",
    `${seat.category} seat ${seat.id}, ${seat.price} ${venue.currency}${seat.unavailable ? ", unavailable" : ""}`
  );

  if (seat.unavailable) {
    button.disabled = true;
    button.classList.add("is-unavailable");
  }

  return button;
}

function renderSeatMap() {
  seatMap.replaceChildren();

  venue.rows.forEach((rowName) => {
    const rowElement = document.createElement("div");
    rowElement.className = "seat-row";

    const startLabel = document.createElement("span");
    startLabel.className = "row-label";
    startLabel.textContent = rowName;
    rowElement.appendChild(startLabel);

    const rowSeats = state.seats.filter((seat) => seat.row === rowName);

    rowSeats.forEach((seat, index) => {
      rowElement.appendChild(createSeatButton(seat));

      if (index === 7) {
        const aisle = document.createElement("span");
        aisle.className = "aisle";
        aisle.setAttribute("aria-hidden", "true");
        rowElement.appendChild(aisle);
      }
    });

    const endLabel = startLabel.cloneNode(true);
    rowElement.appendChild(endLabel);
    seatMap.appendChild(rowElement);
  });

  updateSeatStates();
}

function updateSeatStates() {
  document.querySelectorAll(".seat").forEach((button) => {
    const seatId = button.dataset.seatId;
    const inspected = seatId === state.inspectedSeatId;
    const inCart = isSeatInCart(seatId);

    button.classList.toggle("is-inspected", inspected && !inCart);
    button.classList.toggle("is-in-cart", inCart);
    button.setAttribute("aria-pressed", String(inspected || inCart));
  });

  const availableSeats = state.seats.filter((seat) => !seat.unavailable).length - state.cart.length;
  availableCount.textContent = availableSeats;
}

function inspectSeat(seatId) {
  const seat = getSeatById(seatId);
  if (!seat || seat.unavailable) return;

  state.inspectedSeatId = seatId;
  seatMessage.textContent = "";
  updateSeatStates();
  renderSeatDetails();
}

function renderSeatDetails() {
  const seat = getSeatById(state.inspectedSeatId);

  if (!seat) {
    seatTitle.textContent = "Select a seat";
    seatDetails.className = "seat-details empty";
    seatDetails.innerHTML = "<p>Choose an available seat on the map to inspect its category and price.</p>";
    addToCartButton.disabled = true;
    addToCartButton.textContent = "ADD TO CART";
    return;
  }

  const inCart = isSeatInCart(seat.id);
  seatTitle.textContent = `Seat ${seat.id}`;
  seatDetails.className = "seat-details";
  seatDetails.innerHTML = `
    <div class="seat-summary">
      <span class="category-badge ${seat.categoryClass}">${seat.category}</span>
      <strong>${seat.price} ${venue.currency}</strong>
    </div>
    <dl class="seat-facts">
      <div><dt>Row</dt><dd>${seat.row}</dd></div>
      <div><dt>Number</dt><dd>${seat.number}</dd></div>
      <div><dt>Status</dt><dd>${inCart ? "In cart" : "Available"}</dd></div>
    </dl>
  `;
  addToCartButton.disabled = inCart;
  addToCartButton.textContent = inCart ? "ALREADY IN CART" : "ADD TO CART";
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch (error) {
    seatMessage.textContent = "The cart could not be saved in this browser.";
  }
}

function restoreCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const restoredIds = new Set();

    state.cart = savedCart.reduce((validTickets, ticket) => {
      const seat = getSeatById(ticket.id);

      if (!seat || seat.unavailable || restoredIds.has(seat.id)) {
        return validTickets;
      }

      restoredIds.add(seat.id);
      validTickets.push({ id: seat.id });
      return validTickets;
    }, []);

    saveCart();
  } catch (error) {
    state.cart = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

function addInspectedSeatToCart() {
  const seat = getSeatById(state.inspectedSeatId);

  if (!seat || seat.unavailable) {
    seatMessage.textContent = "This seat cannot be added.";
    return;
  }

  if (isSeatInCart(seat.id)) {
    seatMessage.textContent = `Seat ${seat.id} is already in your cart.`;
    return;
  }

  state.cart.push({ id: seat.id });
  seatMessage.textContent = `Seat ${seat.id} was added to your cart.`;
  saveCart();
  renderCart();
}

function removeTicket(seatId) {
  state.cart = state.cart.filter((ticket) => ticket.id !== seatId);
  seatMessage.textContent = `Seat ${seatId} was removed from your cart.`;
  saveCart();
  renderCart();
}

function createCartItem(seat) {
  const item = document.createElement("article");
  item.className = "cart-item";
  item.dataset.seatId = seat.id;

  const copy = document.createElement("div");
  copy.className = "cart-item-copy";

  const title = document.createElement("strong");
  title.textContent = `Seat ${seat.id}`;

  const details = document.createElement("span");
  details.textContent = `${seat.category} · ${seat.price} ${venue.currency}`;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-ticket";
  removeButton.dataset.removeSeat = seat.id;
  removeButton.setAttribute("aria-label", `Remove seat ${seat.id}`);
  removeButton.textContent = "×";

  copy.appendChild(title);
  copy.appendChild(details);
  item.appendChild(copy);
  item.appendChild(removeButton);
  return item;
}

function renderCart() {
  cartItems.replaceChildren();

  if (state.cart.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart";
    emptyMessage.textContent = "Your cart is empty.";
    cartItems.appendChild(emptyMessage);
  } else {
    state.cart.forEach((ticket) => {
      const seat = getSeatById(ticket.id);
      if (seat) cartItems.appendChild(createCartItem(seat));
    });
  }

  const total = state.cart.reduce((sum, ticket) => {
    const seat = getSeatById(ticket.id);
    return seat ? sum + seat.price : sum;
  }, 0);

  cartCount.textContent = state.cart.length;
  cartTotal.textContent = `${total} ${venue.currency}`;
  updateSeatStates();
  renderSeatDetails();
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function updateMapView() {
  const view = state.view;
  venueMap.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  viewStatus.textContent = `Zoom ${Math.round(view.scale * 100)}%`;
}

function changeMapView(action) {
  const movement = 55;
  const view = state.view;

  if (action === "zoom-in") view.scale = clamp(view.scale + 0.1, 0.7, 1.5);
  if (action === "zoom-out") view.scale = clamp(view.scale - 0.1, 0.7, 1.5);
  if (action === "move-up") view.y = clamp(view.y - movement, -260, 260);
  if (action === "move-down") view.y = clamp(view.y + movement, -260, 260);
  if (action === "move-left") view.x = clamp(view.x - movement, -330, 330);
  if (action === "move-right") view.x = clamp(view.x + movement, -330, 330);
  if (action === "reset") state.view = createDefaultView();

  updateMapView();
}

seatMap.addEventListener("click", (event) => {
  const seatButton = event.target.closest(".seat");
  if (seatButton) inspectSeat(seatButton.dataset.seatId);
});

addToCartButton.addEventListener("click", addInspectedSeatToCart);

cartItems.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-seat]");
  if (removeButton) removeTicket(removeButton.dataset.removeSeat);
});

mapControls.addEventListener("click", (event) => {
  const control = event.target.closest("[data-map-action]");
  if (control) changeMapView(control.dataset.mapAction);
});

state.seats = createVenueSeats();
renderSeatMap();
restoreCart();
renderCart();
updateMapView();
