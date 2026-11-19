
class NotificationService {
    private subscribers: Map<string, Set<string>> = new Map();

    // Subscribe a user to an auction
    subscribeUserToItem(auctionId: string, userId: string): void {
        if (!this.subscribers.has(auctionId)) {
            this.subscribers.set(auctionId, new Set());
        }

        this.subscribers.get(auctionId)!.add(userId);
    }

    // Unsubscribe a user from an auction
    unsubscribeUserFromItem(auctionId: string, userId: string): void {
        const users = this.subscribers.get(auctionId);

        if (!users) return;

        users.delete(userId);

        // Remove the auction entry if nobody is subscribed
        if (users.size === 0) {
            this.subscribers.delete(auctionId);
        }
    }

    // Get all users subscribed to an auction
    getItemSubscribers(auctionId: string): string[] {
        const users = this.subscribers.get(auctionId);

        return users ? [...users] : [];
    }
}

export default NotificationService;
