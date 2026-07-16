/**
 * RAFScheduler — aligns domain processing with the browser's paint budget.
 *
 * Pipeline position: BatchProcessor → [RAFScheduler] → Domain Engine → Store
 *
 * Problem it solves:
 * requestAnimationFrame (RAF) gives us a 16.7ms window per frame at 60fps.
 * If we process and write to stores outside the RAF callback, React may
 * schedule renders at arbitrary points — potentially multiple renders per
 * frame (wasted work) or renders mid-paint (visual tearing).
 *
 * Solution:
 * The RAF loop runs once per frame. In each frame:
 * 1. Drain MessageQueue → get this frame's messages
 * 2. BatchProcessor groups them
 * 3. Domain engines process each group
 * 4. Zustand stores are written ONCE per panel per frame
 * 5. React sees ONE coherent state update → ONE render per panel
 *
 * Frame budget awareness:
 * If domain processing takes >8ms (half the 16.7ms budget), the next frame
 * should be skipped to avoid jank. Phase 5 adds performance.now() guards.
 *
 * Phase 5: implement start(), stop(), and the RAF loop body.
 */

export type FrameCallback = (timestamp: DOMHighResTimeStamp) => void;

export interface IRAFScheduler {
  /** Register a callback to run every frame while the scheduler is running. */
  schedule(callback: FrameCallback): () => void; // returns unsubscribe fn
  start(): void;
  stop(): void;
  readonly isRunning: boolean;
}

/**
 * RAFScheduler stub.
 * Phase 5: implement RAF loop with performance budget guard.
 */
export class RAFScheduler implements IRAFScheduler {
  // TODO Phase 5:
  // private rafHandle: number | null = null
  // private readonly callbacks = new Set<FrameCallback>()
  // private _isRunning = false

  get isRunning(): boolean { return false; }

  schedule(_callback: FrameCallback): () => void {
    throw new Error('RAFScheduler not implemented — Phase 5');
  }

  start(): void {
    throw new Error('RAFScheduler not implemented — Phase 5');
  }

  stop(): void {
    throw new Error('RAFScheduler not implemented — Phase 5');
  }
}
