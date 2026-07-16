/**
 * MessageQueue — bounded ring buffer for WebSocket message backpressure.
 *
 * Pipeline position: WebSocket → [MessageQueue] → BatchProcessor → RAF
 *
 * Problem it solves:
 * At peak load (BTC perpetual during high volatility), the exchange delivers
 * 200+ messages/second. React renders at 60fps (16.7ms/frame). Without
 * buffering, each WS message triggers an immediate Zustand write which triggers
 * a React render evaluation — 12× over the frame budget.
 *
 * Solution:
 * - Enqueue all incoming messages into this ring buffer (O(1) per message)
 * - BatchProcessor drains the queue once per animation frame
 * - If queue is full, oldest messages are overwritten (backpressure)
 *   This is acceptable for trading: a stale orderbook level at t-100ms
 *   has zero value; the latest state at t is what matters.
 *
 * Phase 5: implement enqueue(), dequeue(), drain().
 */

export interface IMessageQueue<T> {
  /** Add an item. O(1). Overwrites oldest if at capacity. */
  enqueue(item: T): void;
  /** Remove and return the oldest item. O(1). Returns undefined if empty. */
  dequeue(): T | undefined;
  /** Remove and return all items, clearing the queue. */
  drain(): readonly T[];
  readonly size: number;
  readonly capacity: number;
  readonly isEmpty: boolean;
  readonly isFull: boolean;
}

/**
 * MessageQueue stub — interface and documented contract.
 * Phase 5: replace with ring buffer implementation.
 */
export class MessageQueue<T> implements IMessageQueue<T> {
  // TODO Phase 5: implement as a fixed-size circular buffer
  // private readonly buffer: (T | undefined)[]
  // private head = 0
  // private tail = 0
  // private _size = 0

  constructor(readonly capacity: number) {
    void capacity; // used by future implementation
  }

  enqueue(_item: T): void {
    throw new Error('MessageQueue not implemented — Phase 5');
  }

  dequeue(): T | undefined {
    throw new Error('MessageQueue not implemented — Phase 5');
  }

  drain(): readonly T[] {
    throw new Error('MessageQueue not implemented — Phase 5');
  }

  get size(): number { return 0; }
  get isEmpty(): boolean { return true; }
  get isFull(): boolean { return false; }
}
