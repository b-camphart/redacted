import type { Game } from "./games"

export const newPlayer = {
    /** the server calls this to send an event down stream */
    serialize: (game: Game) => {
        return {
            event: 'newPlayer',
            data: JSON.stringify({ gameId: game.id, numberOfPlayers: game.numberOfPlayers })
        }
    },

    deserialize: (serialized: string) => {
        const deserialized = JSON.parse(serialized)
        if (! ('gameId' in deserialized)) throw new Error(`Expected "gameId" to be property in\n${serialized}`)
        if (! ('numberOfPlayers' in deserialized)) throw new Error(`Expected "gameId" to be property in\n${serialized}`)
        return deserialized as { gameId: string, numberOfPlayers: number }
    } 

}

export const newTask = {
    
}


export interface EventEmitter {
    emit<E extends { type: string }>(event: E): Promise<void>
}

export interface Subscription {
    end(): void;
}

export interface EventSubscriber {
    subscribe<T extends string, E extends { type: T }>(type: T, listener: (event: E) => Promise<void>): Subscription
}

export interface Events extends EventEmitter, EventSubscriber {}

class SubscriptionImpl<E> implements Subscription {

    constructor(
        public handle: (event: E) => Promise<void>,
    ) {}

    end(): void { return; }

}

class EventsImpl implements Events {

    private readonly subscriptions = new Map<string, Set<SubscriptionImpl<any>>>();

    async emit<E extends { type: string }>(event: E): Promise<void> {
        const subscriptionsForEvent = this.subscriptions.get(event.type)
        if (subscriptionsForEvent == null) return;

        const launches = new Array<Promise<unknown>>(subscriptionsForEvent.size);
        let i = 0;
        for (const subscription of subscriptionsForEvent.values()) {
            launches[i] = subscription.handle(event);
            i++;
        }

        await Promise.allSettled(launches);
    }

    subscribe<E>(type: string, listener: (event: E) => Promise<void>): Subscription {
        const subscription = new SubscriptionImpl<E>(listener);

        const subscriptionsForEvent = this.subscriptions.get(type) ?? new Set();
        subscriptionsForEvent.add(subscription);
        
        if (! this.subscriptions.has(type)) this.subscriptions.set(type, subscriptionsForEvent);

        subscription.end = () => subscriptionsForEvent.delete(subscription);

        return subscription;
    }

}

export const events = (): Events => new EventsImpl();