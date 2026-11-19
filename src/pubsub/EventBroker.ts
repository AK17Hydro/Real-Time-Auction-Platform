
type EventListener = (eventData: unknown) => void | Promise<void>;

class EventBroker {
    private listeners: Map<string, Set<EventListener>> = new Map();

    // Register a listener for an event
    subscribe(topic: string, listener: EventListener): void {
        if (!this.listeners.has(topic)) {
            this.listeners.set(topic, new Set());
        }

        this.listeners.get(topic)!.add(listener);
    }

    // Remove a listener
    unsubscribe(topic: string, listener: EventListener): void {
        const topicListeners = this.listeners.get(topic);

        if (!topicListeners) return;

        topicListeners.delete(listener);

        if (topicListeners.size === 0) {
            this.listeners.delete(topic);
        }
    }

    // Publish an event to all its listeners
    async publish(topic: string, eventData: unknown): Promise<void> {
        const topicListeners = this.listeners.get(topic);

        if (!topicListeners) return;

        const results = [...topicListeners].map(async (listener) => {
            try {
                await listener(eventData);
            } catch (error) {
                console.error(`Error in listener for ${topic}:`, error);
            }
        });

        await Promise.all(results);
    }
}

export default EventBroker;
