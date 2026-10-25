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

const state = {
  seats: [],
  inspectedSeatId: null,
  cart: [],
  view: { scale: 1, x: 0, y: 0 }
};

const seatMap = document.querySelector("#seat-map");
const availableCount = document.querySelector("#available-count");
const seatTitle = document.querySelector("#seat-title");
const seatDetails = document.querySelector("#seat-details");
const addToCartButton = document.querySelector("#add-to-cart");
const seatMessage = document.querySelector("#seat-message");

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

    rowElement.appendChild(startLabel.cloneNode(true));
    seatMap.appendChild(rowElement);
  });

  availableCount.textContent = state.seats.filter((seat) => !seat.unavailable).length;
}

function updateSeatSelection() {
  document.querySelectorAll(".seat").forEach((button) => {
    const inspected = button.dataset.seatId === state.inspectedSeatId;
    button.classList.toggle("is-inspected", inspected);
    button.setAttribute("aria-pressed", String(inspected));
  });
}

function inspectSeat(seatId) {
  const seat = getSeatById(seatId);
  if (!seat || seat.unavailable) return;

  state.inspectedSeatId = seatId;
  seatMessage.textContent = "";
  updateSeatSelection();
  renderSeatDetails();
}

function renderSeatDetails() {
  const seat = getSeatById(state.inspectedSeatId);

  if (!seat) {
    seatTitle.textContent = "Select a seat";
    seatDetails.className = "seat-details empty";
    seatDetails.innerHTML = "<p>Choose an available seat on the map to inspect its category and price.</p>";
    addToCartButton.disabled = true;
    return;
  }

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
      <div><dt>Status</dt><dd>Available</dd></div>
    </dl>
  `;
  addToCartButton.disabled = false;
}

seatMap.addEventListener("click", (event) => {
  const seatButton = event.target.closest(".seat");
  if (seatButton) inspectSeat(seatButton.dataset.seatId);
});

state.seats = createVenueSeats();
renderSeatMap();
