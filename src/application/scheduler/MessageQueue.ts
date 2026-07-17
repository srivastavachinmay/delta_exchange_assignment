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
 */

export interface IMessageQueue<T> {
  /** Add an item. O(1). Overwrites oldest if at capacity. */
  enqueue(item: T): void;
  /** Remove and return the oldest item. O(1). Returns undefined if empty. */
  dequeue(): T | undefined;
  /** Remove and return all items in FIFO order, clearing the queue. */
  drain(): readonly T[];
  readonly size: number;
  readonly capacity: number;
  readonly isEmpty: boolean;
  readonly isFull: boolean;
}

const EMPTY: readonly never[] = [];

/**
 * Fixed-capacity circular ring buffer.
 *
 * Invariants:
 *   head  — index of the next item to read (oldest)
 *   tail  — index where the next item will be written
 *   _size — number of items currently held
 *
 * When full, enqueue overwrites the oldest item by advancing head before
 * writing at tail. This is intentional backpressure: for market data, only
 * the latest state matters.
 */
export class MessageQueue<T> implements IMessageQueue<T> {
  private readonly buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private _size = 0;

  constructor(readonly capacity: number) {
    if (capacity < 1) throw new RangeError('MessageQueue capacity must be ≥ 1');
    this.buffer = new Array<T | undefined>(capacity);
  }

  enqueue(item: T): void {
    if (this._size === this.capacity) {
      // Drop oldest to make room — advance head
      this.buffer[this.head] = undefined;
      this.head = (this.head + 1) % this.capacity;
      this._size--;
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this._size++;
  }

  dequeue(): T | undefined {
    if (this._size === 0) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this._size--;
    return item;
  }

  drain(): readonly T[] {
    if (this._size === 0) return EMPTY;
    const count = this._size;
    const items = new Array<T>(count);
    for (let i = 0; i < count; i++) {
      const idx = (this.head + i) % this.capacity;
      items[i] = this.buffer[idx] as T;
      this.buffer[idx] = undefined;
    }
    this.head = 0;
    this.tail = 0;
    this._size = 0;
    return items;
  }

  get size(): number { return this._size; }
  get isEmpty(): boolean { return this._size === 0; }
  get isFull(): boolean { return this._size === this.capacity; }
}
