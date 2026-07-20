export interface IMessageQueue<T> {
  enqueue(item: T): void;
  dequeue(): T | undefined;
  drain(): readonly T[];
  readonly size: number;
  readonly capacity: number;
  readonly isEmpty: boolean;
  readonly isFull: boolean;
}

const EMPTY: readonly never[] = [];

// Ring buffer. When full, enqueue overwrites the oldest item —
// acceptable backpressure for market data where only latest state matters.
// head = next read index, tail = next write index, _size = item count.
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
