
import EventBroker from "./EventBroker";
import ConnectionManager from "../singleton/ConnectionManager";
import { NotificationMessage } from "../shared/types";

class NotificationService {
    private subscribers: Map<string, Set<string>> = new Map();

    constructor(
        private eventBroker: EventBroker,
        private connectionManager: ConnectionManager
    ) {
        this.registerListeners();
    }

    // Manage auction subscriptions
    subscribeUserToItem(auctionId: string, userId: string): void {
        if (!this.subscribers.has(auctionId)) {
            this.subscribers.set(auctionId, new Set());
        }

        this.subscribers.get(auctionId)!.add(userId);
    }

    unsubscribeUserFromItem(auctionId: string, userId: string): void {
        const users = this.subscribers.get(auctionId);
        if (!users) return;

        users.delete(userId);

        if (users.size === 0) {
            this.subscribers.delete(auctionId);
        }
    }

    getItemSubscribers(auctionId: string): string[] {
        return [...(this.subscribers.get(auctionId) ?? [])];
    }

    // Register event listeners
    private registerListeners(): void {
        this.eventBroker.subscribe(
            "auction:started",
            this.handleAuctionStarted.bind(this)
        );

        this.eventBroker.subscribe(
            "auction:bid_placed",
            this.handleBidPlaced.bind(this)
        );

        this.eventBroker.subscribe(
            "auction:created",
            this.handleAuctionCreated.bind(this)
        );
    }

    

    // Notify subscribers when a new bid is placed
    private async handleBidPlaced(eventData: any): Promise<void> {
        const { auctionId, bidderId, amount, title } = eventData;

        if (!auctionId || !bidderId) {
            console.warn("Cannot send NEW_BID_ALERT: missing auctionId or bidderId.");
            return;
        }

        const message = {
            type: "NEW_BID_ALERT",
            auctionId,
            senderId: bidderId,
            payload: {
                title,
                amount,
                bidderId
            },
            timestamp: new Date().toISOString()
        };

        const subscribers = this.getItemSubscribers(auctionId);

        for (const userId of subscribers) {
            // The bidder must not receive their own notification.
            if (userId === bidderId) continue;

            // Users already viewing the auction receive updates in the room.
            if (this.connectionManager.isUserInRoom(userId, auctionId)) continue;

            await this.connectionManager.sendToUser(userId, message);
        }
    }

    // Notify subscribers when an auction starts
    private async handleAuctionStarted(eventData: any): Promise<void> {
        const auction = eventData.auction ?? eventData;
        const auctionId = auction.auctionId ?? auction.id;

        if (!auctionId) {
            console.warn("Cannot send AUCTION_STARTED: missing auctionId.");
            return;
        }

        const message = {
            type: "AUCTION_STARTED",
            auctionId,
            payload: {
                title: auction.title,
                startingPrice: auction.startingPrice
            },
            timestamp: new Date().toISOString()
        };

        for (const userId of this.getItemSubscribers(auctionId)) {
            await this.connectionManager.sendToUser(userId, message);
        }
    }

    // Notify everyone when a new auction is created
    private async handleAuctionCreated(eventData: any): Promise<void> {
        const auction = eventData.auction ?? eventData;
        const auctionId = auction.auctionId ?? auction.id;

        const message: NotificationMessage = {
            type: "NEW_LISTING",
            auctionId,
            payload: auction,
            timestamp: new Date().toISOString()
        };

        await this.connectionManager.broadcastAll(message);
    }


    handleSubscriptionMessage(message: {
        type: string;
        auctionId?: string;
        senderId?: string;
    }): boolean {
        const { type, auctionId, senderId } = message;

        if (!auctionId || !senderId) {
            return false;
        }

        switch (type) {
            case "SUBSCRIBE_ITEM":
                this.subscribeUserToItem(auctionId, senderId);
                return true;

            case "UNSUBSCRIBE_ITEM":
                this.unsubscribeUserFromItem(auctionId, senderId);
                return true;

            default:
                return false;
        }
    }

}



export default NotificationService;
