/**
 * RAFScheduler — aligns domain processing with the browser's paint budget.
 *
 * Pipeline position: BatchProcessor → [RAFScheduler] → Domain Engine → Store
 *
 * Problem it solves:
 * requestAnimationFrame (RAF) gives us a 16.7ms window per frame at 60fps.
 * Processing and writing to stores outside RAF means React may schedule
 * renders at arbitrary points, potentially multiple per frame (wasted work).
 *
 * Solution:
 * The RAF loop runs once per frame. In each frame:
 * 1. All registered callbacks fire (drain queue, batch, process, store write)
 * 2. React sees ONE coherent state update per panel
 * 3. ONE render per affected symbol
 *
 * Frame budget guard:
 * If callbacks take >8ms (half the 16.7ms budget), a warning is emitted in
 * development. The next frame is still scheduled — dropping frames entirely
 * would cause visible staleness, which is worse than a brief overrun.
 */

export type FrameCallback = (timestamp: DOMHighResTimeStamp) => void;

export interface IRAFScheduler {
  schedule(callback: FrameCallback): () => void;
  start(): void;
  stop(): void;
  readonly isRunning: boolean;
}

export class RAFScheduler implements IRAFScheduler {
  private rafHandle: number | null = null;
  private readonly callbacks = new Set<FrameCallback>();
  private _isRunning = false;

  get isRunning(): boolean { return this._isRunning; }

  /**
   * Register a callback to run every animation frame.
   * Returns an unsubscribe function.
   */
  schedule(callback: FrameCallback): () => void {
    this.callbacks.add(callback);
    return () => { this.callbacks.delete(callback); };
  }

  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.rafHandle = requestAnimationFrame(this._tick);
  }

  stop(): void {
    if (!this._isRunning) return;
    this._isRunning = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  // Arrow function preserves `this` across rAF callback invocations
  private readonly _tick = (timestamp: DOMHighResTimeStamp): void => {
    if (!this._isRunning) return;

    const frameStart = performance.now();
    this.callbacks.forEach((cb) => cb(timestamp));

    if (import.meta.env.DEV) {
      const elapsed = performance.now() - frameStart;
      if (elapsed > 8) {
        console.warn(`[RAFScheduler] frame overrun: ${elapsed.toFixed(1)}ms (budget: 8ms)`);
      }
    }

    this.rafHandle = requestAnimationFrame(this._tick);
  };
}
