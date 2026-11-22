
// ==========================================
// 1. WebSocket connection and user identity
// ==========================================

// Temporary user identity for development.
// Authentication can replace this later.
const userId =
    sessionStorage.getItem("auctionUserId") ||
    `user_${crypto.randomUUID()}`;

sessionStorage.setItem("auctionUserId", userId);

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

const socket = new WebSocket(`${protocol}//${window.location.host}`);

const connectionStatus = document.getElementById("connection-status");

socket.addEventListener("open", () => {
    connectionStatus.textContent = "Connected";
    connectionStatus.className = "text-success";
    console.log("WebSocket connected");
});

socket.addEventListener("close", () => {
    connectionStatus.textContent = "Disconnected";
    connectionStatus.className = "text-warning";
    console.log("WebSocket disconnected");
});

socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
});


// ==========================================
// 2. Send messages to the backend
// ==========================================

function sendMessage(type, auctionId = undefined, payload = {}) {
    if (socket.readyState !== WebSocket.OPEN) {
        showToast("Not connected to the server.", "danger");
        return;
    }

    const message = {
        type,
        senderId: userId,
        payload,
        timestamp: new Date().toISOString()
    };

    if (auctionId) {
        message.auctionId = auctionId;
    }

    socket.send(JSON.stringify(message));
}


// ==========================================
// 3. Receive and process server messages
// ==========================================

socket.addEventListener("message", (event) => {
    try {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case "AUCTION_STARTED":
                showToast(
                    `Auction ${message.auctionId} has started!`,
                    "success"
                );
                break;

            case "NEW_BID_ALERT":
                showToast(
                    `A new bid was placed on auction ${message.auctionId}.`,
                    "info"
                );
                break;

            case "NEW_LISTING": {
                const auction = message.payload?.auction ??
                                message.payload;

                if (auction?.id) {
                    addAuctionToCatalog(auction);
                }

                showToast("A new auction listing is available!", "success");
                break;
            }

            default:
                console.log("Received message:", message);
        }
    } catch (error) {
        console.error("Could not process WebSocket message:", error);
    }
});


// ==========================================
// 4. Display toast notifications
// ==========================================

function showToast(message, type = "info") {
    const container = document.getElementById("notification-container");

    const toast = document.createElement("div");
    toast.className = `alert alert-${type} auction-toast`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}


// ==========================================
// 5. Auction catalog
// ==========================================

const auctions = new Map();

function addAuctionToCatalog(auction) {
    auctions.set(auction.id, auction);
    renderAuction(auction);
}

function renderAuction(auction) {
    const isScheduled = auction.status === "SCHEDULED";

    const container = document.getElementById(
        isScheduled ? "scheduled-auctions" : "live-auctions"
    );

    // Remove an existing card before updating it.
    const existingCard = document.getElementById(`auction-${auction.id}`);

    if (existingCard) {
        existingCard.remove();
    }

    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";
    column.id = `auction-${auction.id}`;

    const card = document.createElement("div");
    card.className = "card auction-card";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h5");
    title.textContent = auction.title;

    const description = document.createElement("p");
    description.className = "text-muted";
    description.textContent = auction.description;

    const price = document.createElement("p");
    price.className = "auction-price";
    price.textContent = `Current price: ${auction.currentPrice}`;

    const status = document.createElement("span");
    status.className = "badge auction-status bg-primary";
    status.textContent = auction.status;

    const subscribeButton = document.createElement("button");
    subscribeButton.className = "btn btn-outline-primary btn-sm";
    subscribeButton.textContent = "Subscribe";
    subscribeButton.dataset.action = "subscribe";
    subscribeButton.dataset.auctionId = auction.id;

    const openButton = document.createElement("button");
    openButton.className = "btn btn-primary btn-sm";
    openButton.textContent = "Open Auction";
    openButton.dataset.action = "open";
    openButton.dataset.auctionId = auction.id;

    body.append(title, description, price, status,
                document.createElement("br"),
                subscribeButton, openButton);

    card.appendChild(body);
    column.appendChild(card);
    container.appendChild(column);
}


// ==========================================
// 6. Subscribe / unsubscribe from auctions
// ==========================================

const subscriptions = new Set();

document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const auctionId = button.dataset.auctionId;
    const action = button.dataset.action;

    if (action === "subscribe") {
        if (subscriptions.has(auctionId)) {
            sendMessage("UNSUBSCRIBE_ITEM", auctionId);
            subscriptions.delete(auctionId);
            button.textContent = "Subscribe";
            button.classList.replace(
                "btn-primary",
                "btn-outline-primary"
            );
        } else {
            sendMessage("SUBSCRIBE_ITEM", auctionId);
            subscriptions.add(auctionId);
            button.textContent = "Unsubscribe";
            button.classList.replace(
                "btn-outline-primary",
                "btn-primary"
            );
        }
    }

    if (action === "open") {
        // Bidding screen navigation will be implemented
        // when the bidding interface is integrated.
        showToast(`Selected auction: ${auctionId}`);
    }
});


// ==========================================
// 7. Create a new auction listing
// ==========================================

const listingForm = document.getElementById("listing-form");

listingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const startOption = document.getElementById("start-option").value;
    const duration = Number(document.getElementById("duration").value);

    const startTime = startOption === "now"
        ? new Date()
        : new Date(document.getElementById("start-time").value);

    if (Number.isNaN(startTime.getTime()) || startTime <= new Date() && startOption === "scheduled") {
        showToast("Please choose a valid future start time.", "danger");
        return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
        showToast("Duration must be greater than zero.", "danger");
        return;
    }

    const endTime = new Date(startTime.getTime() + duration * 60000);

    const payload = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        startingPrice: Number(document.getElementById("starting-price").value),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        strategyType: document.getElementById("strategy").value,
        stepValue: Number(document.getElementById("step-value").value)
    };

    if (
        !payload.title ||
        !payload.description ||
        payload.startingPrice <= 0 ||
        payload.stepValue <= 0
    ) {
        showToast("Please provide valid listing information.", "danger");
        return;
    }

    sendMessage("CREATE_LISTING", undefined, payload);

    showToast("Listing request sent to the server.", "success");
    listingForm.reset();
});


// ==========================================
// 8. Show or hide scheduled start date
// ==========================================

const startOption = document.getElementById("start-option");
const scheduledTimeGroup = document.getElementById("scheduled-time-group");
const startTimeInput = document.getElementById("start-time");

startOption.addEventListener("change", () => {
    const scheduled = startOption.value === "scheduled";

    scheduledTimeGroup.hidden = !scheduled;
    startTimeInput.required = scheduled;
});
