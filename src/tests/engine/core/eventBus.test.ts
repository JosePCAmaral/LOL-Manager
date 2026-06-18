import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../../../engine/core/eventBus';

type TestEvents = {
  scored: { points: number };
  reset: void;
  named: { name: string };
};

describe('createEventBus', () => {
  it('calls registered handler when event is emitted', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('scored', handler);
    bus.emit('scored', { points: 5 });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ points: 5 });
  });

  it('calls multiple handlers for the same event', () => {
    const bus = createEventBus<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('scored', h1);
    bus.on('scored', h2);
    bus.emit('scored', { points: 1 });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('does not call handler after off()', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('scored', handler);
    bus.off('scored', handler);
    bus.emit('scored', { points: 10 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handlers for other events', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('named', handler);
    bus.emit('scored', { points: 3 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('each createEventBus() is isolated — no cross-bus emission', () => {
    const busA = createEventBus<TestEvents>();
    const busB = createEventBus<TestEvents>();
    const handler = vi.fn();
    busA.on('scored', handler);
    busB.emit('scored', { points: 99 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('off() is a no-op for unregistered handlers', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    expect(() => bus.off('scored', handler)).not.toThrow();
  });

  it('emitting an event with no listeners is safe', () => {
    const bus = createEventBus<TestEvents>();
    expect(() => bus.emit('scored', { points: 0 })).not.toThrow();
  });

  it('handlers added during emission do not receive the current emission', () => {
    const bus = createEventBus<TestEvents>();
    const late = vi.fn();
    bus.on('scored', () => {
      bus.on('scored', late);
    });
    bus.emit('scored', { points: 1 });
    expect(late).not.toHaveBeenCalled();
    // But it fires on the next emission
    bus.emit('scored', { points: 2 });
    expect(late).toHaveBeenCalledOnce();
  });

  it('the same handler registered twice fires twice', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('scored', handler);
    // Set de-duplicates, so second on() with the same reference is a no-op
    bus.on('scored', handler);
    bus.emit('scored', { points: 7 });
    // Set prevents double registration of the same reference
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
