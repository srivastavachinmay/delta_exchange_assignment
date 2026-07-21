import type { InboundMessage, RawTickerMessage, RawOrderBookMessage, RawTradeMessage, TradingSymbol } from '@/shared/types';
import type { IMessageQueue } from './scheduler/MessageQueue';
import type { IBatchProcessor, BatchGroup } from './scheduler/BatchProcessor';
import type { IRAFScheduler } from './scheduler/RAFScheduler';
import type { OrderBookEngine } from '@/domain/services/OrderBookEngine';
import type { TradeEngine } from '@/domain/services/TradeEngine';
import type { TickerEngine } from '@/domain/services/TickerEngine';
import type { OrderBookPublisher } from './orderbook/OrderBookPublisher';
import type { TradePublisher } from './trades/TradePublisher';
import type { TickerPublisher } from './ticker/TickerPublisher';
import type { Ticker } from '@/domain/entities/Ticker';
import type { OrderBookViewModel } from '@/domain/entities/OrderBookViewModel';
import type { TradeSnapshot } from '@/domain/entities/Trade';

/**
 * PipelineOutputPort — outbound port for publishing processed market data.
 *
 * Decouples the pipeline from Zustand. Tests inject a mock implementation.
 * The composition root (WebSocketProvider) injects the real store writes.
 */
export interface PipelineOutputPort {
  getGroupingStep(symbol: TradingSymbol): number;
  publishTickers(tickers: readonly Ticker[]): void;
  publishOrderBook(vms: readonly OrderBookViewModel[]): void;
  publishTrades(snapshots: readonly TradeSnapshot[]): void;
}

/**
 * MarketDataPipeline — per-frame orchestration of the realtime data pipeline.
 *
 * Pipeline position: MessageQueue → [MarketDataPipeline] → Zustand Stores
 *
 * Responsibilities:
 * - Drain the queue each RAF tick
 * - Dispatch batches to domain engines
 * - Trigger publisher flushes and collect results
 * - Delegate store writes to PipelineOutputPort
 *
 * Extracted from WebSocketProvider so the pipeline can be tested without
 * mounting a React component. Inject a mock PipelineOutputPort and a
 * synchronous fake scheduler to drive ticks in unit tests.
 */
export class MarketDataPipeline {
  constructor(
    private readonly queue: IMessageQueue<InboundMessage>,
    private readonly batchProcessor: IBatchProcessor,
    private readonly scheduler: IRAFScheduler,
    private readonly tickerEngine: TickerEngine,
    private readonly orderBookEngine: OrderBookEngine,
    private readonly tradeEngine: TradeEngine,
    private readonly tickerPublisher: TickerPublisher,
    private readonly orderBookPublisher: OrderBookPublisher,
    private readonly tradePublisher: TradePublisher,
    private readonly output: PipelineOutputPort,
  ) {}

  /** Start the RAF loop. Returns a cleanup function that stops it. */
  start(): () => void {
    const unschedule = this.scheduler.schedule(this._tick);
    this.scheduler.start();
    return () => {
      unschedule();
      this.scheduler.stop();
    };
  }

  private readonly _tick = (timestamp: DOMHighResTimeStamp): void => {
    const messages = this.queue.drain();

    if (messages.length > 0) {
      const batches = this.batchProcessor.process(messages);
      for (const batch of batches) {
        this._dispatchBatch(batch);
      }
    }

    this.tickerPublisher.tryFlush(timestamp, (tickers) => {
      this.output.publishTickers(tickers);
    });

    this.orderBookPublisher.tryFlush(timestamp, (symbols) => {
      const vms: OrderBookViewModel[] = [];
      for (const symbol of symbols) {
        const book = this.orderBookEngine.snapshot(symbol);
        if (!book) continue;
        const step = this.output.getGroupingStep(symbol);
        vms.push(this.orderBookPublisher.transform(book, step));
      }
      if (vms.length > 0) this.output.publishOrderBook(vms);
    });

    this.tradePublisher.tryFlush(timestamp, (symbols) => {
      const nowMs = Date.now();
      const snapshots: TradeSnapshot[] = [];
      for (const symbol of symbols) {
        const snapshot = this.tradeEngine.snapshot(symbol, nowMs);
        if (!snapshot) continue;
        snapshots.push(snapshot);
      }
      if (snapshots.length > 0) this.output.publishTrades(snapshots);
    });
  };

  private _dispatchBatch(batch: BatchGroup): void {
    switch (batch.channel) {
      case 'ticker': {
        // last-wins: only the final message in the batch reaches the engine
        const lastMsg = batch.messages[batch.messages.length - 1] as RawTickerMessage;
        try {
          const ticker = this.tickerEngine.process(lastMsg);
          this.tickerPublisher.update(ticker); // staleness guard is inside the publisher
        } catch (err) {
          if (import.meta.env.DEV) console.warn('[TickerEngine] malformed message dropped:', err);
        }
        break;
      }

      case 'orderbook': {
        for (const msg of batch.messages) {
          const raw = msg as RawOrderBookMessage;
          try {
            this.orderBookEngine.apply(raw);
            this.orderBookPublisher.markDirty(raw.symbol);
          } catch (err) {
            if (import.meta.env.DEV) console.warn('[OrderBookEngine] message dropped:', err);
          }
        }
        break;
      }

      case 'trades': {
        for (const msg of batch.messages) {
          const raw = msg as RawTradeMessage;
          try {
            this.tradeEngine.apply(raw);
            this.tradePublisher.markDirty(raw.symbol);
          } catch (err) {
            if (import.meta.env.DEV) console.warn('[TradeEngine] message dropped:', err);
          }
        }
        break;
      }
    }
  }
}
