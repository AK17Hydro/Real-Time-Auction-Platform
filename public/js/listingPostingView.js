
// ==========================================
// Create a new auction listing
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
        showToast("Please choose a valid future start time.");
        return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
        showToast("Duration must be greater than zero."
        );
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
        showToast("Please provide valid listing information.");
        return;
    }

    sendMessage("CREATE_LISTING", undefined, payload);

    showToast("Listing request sent to the server.");
    listingForm.reset();
});


// ==========================================
// Auction catalog
// ==========================================

const auctions = new Map();

function addAuctionToCatalog(auction) {
    auctions.set(auction.id, auction);
    renderAuction(auction);
}

function updateAuctionStatus(auctionId, newStatus) {
    const auction = auctions.get(auctionId);

    if (!auction) {
        console.warn(`Auction ${auctionId} is not in the catalog.`);
        return;
    }

    auction.status = newStatus;
    renderAuction(auction);
}

function formatCountdown(milliseconds) {
    if (milliseconds <= 0) {
        return "Starting soon...";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function renderAuction(auction) {
    const isScheduled = auction.status === "SCHEDULED";

    const container = document.getElementById(
        isScheduled ? "scheduled-auctions" : "live-auctions"
    );

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

    let countdown = null;

    if (isScheduled) {
        countdown = document.createElement("p");
        countdown.className = "auction-countdown mt-2";
        countdown.dataset.startTime = auction.startTime;

        countdown.textContent = formatCountdown(
            new Date(auction.startTime).getTime() - Date.now()
        );
    }

    const subscribeButton = document.createElement("button");
    subscribeButton.className = "btn btn-sm";
    subscribeButton.dataset.action = "subscribe";
    subscribeButton.dataset.auctionId = auction.id;

    const isSubscribed = subscriptions.has(auction.id);

    subscribeButton.textContent = isSubscribed
        ? "Unsubscribe"
        : "Subscribe";

    subscribeButton.classList.add(
        isSubscribed ? "btn-primary" : "btn-outline-primary"
    );

    const openButton = document.createElement("button");
    openButton.className = "btn btn-primary btn-sm";
    openButton.textContent = "Open Auction";
    openButton.dataset.action = "open";
    openButton.dataset.auctionId = auction.id;

    body.append(title, description, price, status);

    if (countdown) {
        body.appendChild(countdown);
    }

    body.append(
        document.createElement("br"),
        subscribeButton,
        openButton
    );

    card.appendChild(body);
    column.appendChild(card);
    container.appendChild(column);
}

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

setInterval(() => {
    document.querySelectorAll(".auction-countdown").forEach((element) => {
        const startTime = new Date(element.dataset.startTime).getTime();

        element.textContent = formatCountdown(startTime - Date.now());
    });
}, 1000);

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
        const isSubscribed = subscriptions.has(auctionId);

        if (isSubscribed) {
            sendMessage("UNSUBSCRIBE_ITEM", auctionId);
            subscriptions.delete(auctionId);
        } else {
            sendMessage("SUBSCRIBE_ITEM", auctionId);
            subscriptions.add(auctionId);
        }

        button.textContent = isSubscribed ? "Subscribe" : "Unsubscribe";

        button.classList.toggle("btn-primary", !isSubscribed);
        button.classList.toggle("btn-outline-primary", isSubscribed);
    }

    if (action === "open") {
        sendMessage("JOIN_ROOM", auctionId);
    }
});

// ==========================================
// 4. Display toast notifications
// ==========================================

function showToast(message, auctionId = null) {
    const toast = document.createElement("div");
    toast.className = "alert alert-info notification-toast";

    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);

    if (auctionId) {
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "btn btn-sm btn-primary ms-3";
        viewButton.textContent = "View auction";

        viewButton.addEventListener("click", () => {
            openAuction(auctionId);
        });

        toast.appendChild(viewButton);
    }

    document.getElementById("notification-container").appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
}