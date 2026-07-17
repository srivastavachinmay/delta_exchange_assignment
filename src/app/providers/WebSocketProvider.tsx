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
import { FocusSymbolUseCase } from '@/application/useCases/FocusSymbolUseCase';
import { TickerEngine } from '@/domain/services/TickerEngine';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';
import type { InboundMessage, RawTickerMessage } from '@/shared/types';
import { useConnectionStore } from '@/app/stores/connectionStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';
import { useTickerStore } from '@/app/stores/tickerStore';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';

interface Props {
  readonly children: ReactNode;
}

// Sized to hold ~2 frames of peak traffic across all channels with headroom.
// At 200 msg/sec × 16.7ms × 6 symbols ≈ 20 ticker messages per frame.
// 256 accommodates future orderbook + trades channels without overflow.
const QUEUE_CAPACITY = 256;

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    // --- Application layer ---
    const subscriptionHandler = new SubscriptionHandler({
      onAcknowledge: (symbols, channels) =>
        useSubscriptionStore.getState().acknowledge(symbols, channels),
      onRemove: (symbols, channels) =>
        useSubscriptionStore.getState().remove(symbols, channels),
    });

    // --- Pipeline: queue → batchprocessor → scheduler ---
    const queue = new MessageQueue<InboundMessage>(QUEUE_CAPACITY);
    const batchProcessor = new BatchProcessor();
    const rafScheduler = new RAFScheduler();
    const tickerPublisher = new TickerPublisher();

    // Queue is injected so the router enqueues market data instead of dispatching directly.
    // Control messages (subscription, connection) still dispatch immediately.
    const router = new MessageRouter(subscriptionHandler, queue);

    // --- Infrastructure layer ---
    const storageAdapter = new LocalStorageAdapter();

    subscriptionManager.setCallbacks({
      onDesiredAdded: (symbols, channel) =>
        useSubscriptionStore.getState().addDesired(symbols, [channel]),
      onDesiredRemoved: (symbols, channel) =>
        useSubscriptionStore.getState().removeDesired(symbols, [channel]),
    });

    const adapter = new WebSocketAdapter(router, wsManager, subscriptionManager);
    adapter.initialize();

    // --- Ticker domain engine ---
    const tickerEngine = new TickerEngine();

    // RAF frame callback: drain → batch → process → TickerPublisher → store.
    // TickerPublisher throttles store writes to the display interval so React
    // renders at a human-readable rate while every message is still processed.
    const unschedule = rafScheduler.schedule((timestamp) => {
      const messages = queue.drain();

      if (messages.length > 0) {
        const batches = batchProcessor.process(messages);

        for (const batch of batches) {
          if (batch.channel === 'ticker') {
            let latestTicker = null;
            for (const msg of batch.messages) {
              const raw = msg as RawTickerMessage;
              try {
                const ticker = tickerEngine.process(raw);
                const prev = latestTicker ?? useTickerStore.getState().tickers.get(raw.symbol);
                if (tickerEngine.isValidUpdate(ticker, prev)) {
                  latestTicker = ticker;
                }
              } catch (err) {
                if (import.meta.env.DEV) {
                  console.warn('[TickerEngine] malformed message dropped:', err);
                }
              }
            }
            if (latestTicker !== null) {
              tickerPublisher.update(latestTicker);
            }
          }
          // orderbook and trades: handled in later phases
        }
      }

      // Always attempt flush — ensures pending tickers drain even if traffic pauses.
      tickerPublisher.tryFlush(timestamp, (tickers) => {
        useTickerStore.getState().upsertMany(tickers);
      });
    });

    rafScheduler.start();

    // --- Focused symbol: restore from storage on mount, persist on change ---
    const focusUseCase = new FocusSymbolUseCase(
      storageAdapter,
      (symbol) => useFocusedSymbolStore.getState().setFocusedSymbol(symbol),
    );
    useFocusedSymbolStore.getState().setFocusedSymbol(focusUseCase.restore());

    const unsubscribeFocus = useFocusedSymbolStore.subscribe(
      (s) => s.focusedSymbol,
      (symbol) => storageAdapter.set(STORAGE_KEYS.FOCUSED_SYMBOL, symbol),
    );

    // --- Connection status callbacks ---
    wsManager.setStatusCallbacks({
      onStatus: (status) => useConnectionStore.getState().setStatus(status),
      onConnected: (connectedAt) => useConnectionStore.getState().setConnected(connectedAt),
      onReconnecting: (attempt) => useConnectionStore.getState().setReconnecting(attempt),
      onError: (message) => useConnectionStore.getState().setError(message),
    });

    // SubscriptionManager tracks desired set and replays on every reconnect.
    wsManager.connect();

    return () => {
      unschedule();
      rafScheduler.stop();
      unsubscribeFocus();
      adapter.cleanup();
      wsManager.disconnect();
      useConnectionStore.getState().reset();
      useSubscriptionStore.getState().reset();
      useTickerStore.getState().reset();
    };
  }, []);

  return <>{children}</>;
}
