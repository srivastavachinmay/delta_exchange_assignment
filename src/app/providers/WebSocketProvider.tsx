import { useEffect, type ReactNode } from 'react';
import { wsManager } from '@/infrastructure/websocket/WebSocketManager';
import { subscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { WebSocketAdapter } from '@/infrastructure/websocket/WebSocketAdapter';
import { LocalStorageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';
import { MessageRouter } from '@/application/MessageRouter';
import { SubscriptionHandler } from '@/application/SubscriptionHandler';
import { MessageQueue } from '@/application/scheduler/MessageQueue';
import { BatchProcessor } from '@/application/scheduler/BatchProcessor';
import { RAFScheduler } from '@/application/scheduler/RAFScheduler';
import { TickerPublisher } from '@/application/ticker/TickerPublisher';
import { OrderBookPublisher } from '@/application/orderbook/OrderBookPublisher';
import { FocusSymbolUseCase } from '@/application/useCases/FocusSymbolUseCase';
import { TickerEngine } from '@/domain/services/TickerEngine';
import { OrderBookEngine } from '@/domain/services/OrderBookEngine';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';
import { TradePublisher } from '@/application/trades/TradePublisher';
import { TradeEngine } from '@/domain/services/TradeEngine';
import type { InboundMessage, RawTickerMessage, RawOrderBookMessage, RawTradeMessage } from '@/shared/types';
import { useConnectionStore } from '@/app/stores/connectionStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';
import { useTickerStore } from '@/app/stores/tickerStore';
import { useOrderBookViewStore } from '@/app/stores/orderBookViewStore';
import { useGroupingStore } from '@/app/stores/groupingStore';
import { useTradeStore } from '@/app/stores/tradeStore';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';

interface Props {
  readonly children: ReactNode;
}

// Sized to hold ~2 frames of peak traffic across all channels with headroom.
const QUEUE_CAPACITY = 256;

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    const subscriptionHandler = new SubscriptionHandler({
      onAcknowledge: (symbols, channels) =>
        useSubscriptionStore.getState().acknowledge(symbols, channels),
      onRemove: (symbols, channels) =>
        useSubscriptionStore.getState().remove(symbols, channels),
    });

    const queue = new MessageQueue<InboundMessage>(QUEUE_CAPACITY);    const batchProcessor = new BatchProcessor();
    const rafScheduler = new RAFScheduler();
    const tickerPublisher = new TickerPublisher();
    const orderBookPublisher = new OrderBookPublisher();
    const tradePublisher = new TradePublisher();

    // Queue is injected so the router enqueues market data instead of dispatching directly.
    // Control messages (subscription, connection) still dispatch immediately.
    const router = new MessageRouter(subscriptionHandler, queue);

    const storageAdapter = new LocalStorageAdapter();

    subscriptionManager.setCallbacks({
      onDesiredAdded: (symbols, channel) =>
        useSubscriptionStore.getState().addDesired(symbols, [channel]),
      onDesiredRemoved: (symbols, channel) =>
        useSubscriptionStore.getState().removeDesired(symbols, [channel]),
    });

    const adapter = new WebSocketAdapter(router, wsManager, subscriptionManager);
    adapter.initialize();

    const tickerEngine = new TickerEngine();
    const orderBookEngine = new OrderBookEngine();
    const tradeEngine = new TradeEngine();

    const unschedule = rafScheduler.schedule((timestamp) => {
      const messages = queue.drain();

      if (messages.length > 0) {
        const batches = batchProcessor.process(messages);

        for (const batch of batches) {
          if (batch.channel === 'ticker') {
            const lastMsg = batch.messages[batch.messages.length - 1] as RawTickerMessage;
            try {
              const ticker = tickerEngine.process(lastMsg);
              const prev = useTickerStore.getState().tickers.get(lastMsg.symbol);
              if (tickerEngine.isValidUpdate(ticker, prev)) {
                tickerPublisher.update(ticker);
              }
            } catch (err) {
              if (import.meta.env.DEV) {
                console.warn('[TickerEngine] malformed message dropped:', err);
              }
            }
          }

          if (batch.channel === 'orderbook') {
            for (const msg of batch.messages) {
              const raw = msg as RawOrderBookMessage;
              try {
                orderBookEngine.apply(raw);
                orderBookPublisher.markDirty(raw.symbol);
              } catch (err) {
                if (import.meta.env.DEV) {
                  console.warn('[OrderBookEngine] message dropped:', err);
                }
              }
            }
          }

          if (batch.channel === 'trades') {
            for (const msg of batch.messages) {
              const raw = msg as RawTradeMessage;
              try {
                tradeEngine.apply(raw);
                tradePublisher.markDirty(raw.symbol);
              } catch (err) {
                if (import.meta.env.DEV) {
                  console.warn('[TradeEngine] message dropped:', err);
                }
              }
            }
          }
        }
      }

      tickerPublisher.tryFlush(timestamp, (tickers) => {
        useTickerStore.getState().upsertMany(tickers);
      });
      orderBookPublisher.tryFlush(timestamp, (symbols) => {
        const vms = [];
        for (const symbol of symbols) {
          const book = orderBookEngine.snapshot(symbol);
          if (!book) continue;
          const step = useGroupingStore.getState().getStep(symbol);
          vms.push(orderBookPublisher.transform(book, step));
        }
        if (vms.length > 0) useOrderBookViewStore.getState().upsertMany(vms);
      });
      tradePublisher.tryFlush(timestamp, (symbols) => {
        const nowMs = Date.now();
        const snapshots = [];
        for (const symbol of symbols) {
          const snapshot = tradeEngine.snapshot(symbol, nowMs);
          if (!snapshot) continue;
          snapshots.push(snapshot);
        }
        if (snapshots.length > 0) useTradeStore.getState().upsertMany(snapshots);
      });
    });

    rafScheduler.start();

    const unsubscribeGrouping = useGroupingStore.subscribe(
      (s) => s.steps,
      (newSteps, prevSteps) => {
        for (const [symbol, step] of newSteps) {
          if (prevSteps.get(symbol) !== step) {
            const book = orderBookEngine.snapshot(symbol);
            if (!book) continue;
            const vm = orderBookPublisher.transform(book, step);
            useOrderBookViewStore.getState().upsert(vm);
          }
        }
      },
    );

    const focusUseCase = new FocusSymbolUseCase(
      storageAdapter,
      (symbol) => useFocusedSymbolStore.getState().setFocusedSymbol(symbol),
    );
    useFocusedSymbolStore.getState().setFocusedSymbol(focusUseCase.restore());

    const unsubscribeFocus = useFocusedSymbolStore.subscribe(
      (s) => s.focusedSymbol,
      (symbol) => storageAdapter.set(STORAGE_KEYS.FOCUSED_SYMBOL, symbol),
    );

    wsManager.setStatusCallbacks({
      onStatus: (status) => useConnectionStore.getState().setStatus(status),
      onConnected: (connectedAt) => useConnectionStore.getState().setConnected(connectedAt),
      onReconnecting: (attempt) => useConnectionStore.getState().setReconnecting(attempt),
      onError: (message) => useConnectionStore.getState().setError(message),
    });

    wsManager.connect();

    return () => {
      unschedule();
      rafScheduler.stop();
      unsubscribeFocus();
      unsubscribeGrouping();
      adapter.cleanup();
      wsManager.disconnect();
      useConnectionStore.getState().reset();
      useSubscriptionStore.getState().reset();
      useTickerStore.getState().reset();
      useOrderBookViewStore.getState().reset();
      useGroupingStore.getState().reset();
      useTradeStore.getState().reset();
    };
  }, []);

  return <>{children}</>;
}
