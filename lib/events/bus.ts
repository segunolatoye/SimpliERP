import EventEmitter from 'events';
import { EventName, EventHandler, EventPayloads } from './types';

class TypedEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow more listeners since many modules will subscribe to the same events
    this.emitter.setMaxListeners(50);
  }

  /**
   * Subscribe to an event
   */
  public subscribe<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.emitter.on(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  public unsubscribe<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.emitter.off(event, handler);
  }

  /**
   * Emit an event asynchronously. The bus guarantees delivery to all listeners,
   * but does not block the caller on listener execution.
   */
  public async emit<T extends EventName>(event: T, payload: EventPayloads[T]): Promise<void> {
    const listeners = this.emitter.listeners(event) as EventHandler<T>[];
    
    // Fire and forget, catching errors so one broken listener doesn't crash the others
    listeners.forEach((listener) => {
      Promise.resolve(listener(payload)).catch((err) => {
        console.error(`[EventBus] Error in listener for event '${event}':`, err);
      });
    });
  }

  /**
   * Check if an event has listeners
   */
  public hasListeners<T extends EventName>(event: T): boolean {
    return this.emitter.listenerCount(event) > 0;
  }
}

// Global singleton to prevent multiple instances during HMR in development
const globalForEventBus = globalThis as unknown as {
  eventBus: TypedEventBus | undefined;
};

export const EventBus = globalForEventBus.eventBus ?? new TypedEventBus();

if (process.env.NODE_ENV !== 'production') {
  globalForEventBus.eventBus = EventBus;
}

// Auto-register subscribers
import { registerFinanceSubscribers } from '@/modules/finance/events/finance-subscriber';
import { registerCoreEvents } from '@/modules/core/events';

// Execute registrations once
if (!globalForEventBus.eventBus || !globalForEventBus.eventBus.hasListeners('purchases.grn_completed')) {
  registerCoreEvents();
  registerFinanceSubscribers();
}
