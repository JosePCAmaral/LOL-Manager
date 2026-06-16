/**
 * Typed pub/sub event bus for internal engine domain events.
 *
 * Design goals:
 * - Generic over the event map so payload types are inferred from event names.
 * - No singleton — callers create isolated instances via createEventBus().
 * - No external dependencies; TypeScript pure.
 *
 * Usage:
 *   type MyEvents = { matchStarted: { matchId: string }; phaseEnded: { phase: string } };
 *   const bus = createEventBus<MyEvents>();
 *   bus.on('matchStarted', ({ matchId }) => console.log(matchId));
 *   bus.emit('matchStarted', { matchId: 'abc' });
 */

type Handler<TPayload> = (payload: TPayload) => void;

export interface EventBus<TEvents extends Record<string, unknown>> {
  /** Subscribe to an event. The same handler reference can be used with off() to unsubscribe. */
  on<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): void;

  /** Unsubscribe a previously registered handler. No-op if the handler was not registered. */
  off<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): void;

  /** Emit an event synchronously, calling all registered handlers in registration order. */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
}

/**
 * Creates and returns a new, isolated EventBus instance.
 * Each call produces an independent bus — no shared global state.
 */
export function createEventBus<TEvents extends Record<string, unknown>>(): EventBus<TEvents> {
  // Use a Map keyed by event name; each value is an ordered Set of handlers.
  // Set preserves insertion order and makes O(1) removal by reference.
  const listeners = new Map<keyof TEvents, Set<Handler<unknown>>>();

  function getOrCreate(event: keyof TEvents): Set<Handler<unknown>> {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  return {
    on<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): void {
      getOrCreate(event).add(handler as Handler<unknown>);
    },

    off<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): void {
      listeners.get(event)?.delete(handler as Handler<unknown>);
    },

    emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
      const set = listeners.get(event);
      if (!set) return;
      // Snapshot the set before iterating so handlers that call off() during
      // emission do not affect the current dispatch.
      for (const handler of Array.from(set)) {
        (handler as Handler<TEvents[K]>)(payload);
      }
    },
  };
}
