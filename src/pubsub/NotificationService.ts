
import EventBroker from "./EventBroker";
import ConnectionManager from "../singleton/ConnectionManager";

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

    // Notify subscribers when an auction starts
    private async handleAuctionStarted(eventData: any): Promise<void> {
        const { auctionId } = eventData;

        const message = {
            type: "AUCTION_STARTED",
            auctionId,
            payload: eventData,
            timestamp: new Date().toISOString()
        };

        for (const userId of this.getItemSubscribers(auctionId)) {
            await this.connectionManager.sendToUser(userId, message);
        }
    }

    // Notify subscribers when a new bid is placed
    private async handleBidPlaced(eventData: any): Promise<void> {
        const { auctionId, bidderId } = eventData;

        const message = {
            type: "NEW_BID_ALERT",
            auctionId,
            senderId: bidderId,
            payload: eventData,
            timestamp: new Date().toISOString()
        };

        const subscribers = this.getItemSubscribers(auctionId);

        for (const userId of subscribers) {
            if (userId === bidderId) continue;

            if (this.connectionManager.isUserInRoom(userId, auctionId)) {
                continue;
            }

            await this.connectionManager.sendToUser(userId, message);
        }
    }

    // Notify everyone when a new auction is created
    private async handleAuctionCreated(eventData: any): Promise<void> {
        const message = {
            type: "NEW_LISTING",
            auctionId: eventData.auctionId,
            payload: eventData,
            timestamp: new Date().toISOString()
        };

        await this.connectionManager.broadcastAll(message);
    }
}

export default NotificationService;
