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
import { TradePublisher } from '@/application/trades/TradePublisher';
import { MarketDataPipeline } from '@/application/MarketDataPipeline';
import { FocusSymbolUseCase } from '@/application/useCases/FocusSymbolUseCase';
import { TickerEngine } from '@/domain/services/TickerEngine';
import { OrderBookEngine } from '@/domain/services/OrderBookEngine';
import { TradeEngine } from '@/domain/services/TradeEngine';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';
import type { InboundMessage } from '@/shared/types';
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

/**
 * WebSocketProvider — composition root for the realtime data pipeline.
 *
 * Responsibilities:
 * - Instantiate all application and domain objects
 * - Wire them together and inject dependencies
 * - Start/stop the pipeline lifecycle
 * - Subscribe to store changes that require pipeline reactions
 *
 * Per-frame orchestration logic lives in MarketDataPipeline (application layer),
 * not here. This component is intentionally thin.
 */
export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    const subscriptionHandler = new SubscriptionHandler({
      onAcknowledge: (symbols, channels) =>
        useSubscriptionStore.getState().acknowledge(symbols, channels),
      onRemove: (symbols, channels) =>
        useSubscriptionStore.getState().remove(symbols, channels),
    });

    const queue = new MessageQueue<InboundMessage>(QUEUE_CAPACITY);
    const batchProcessor = new BatchProcessor();
    const rafScheduler = new RAFScheduler();
    const tickerPublisher = new TickerPublisher();
    const orderBookPublisher = new OrderBookPublisher();
    const tradePublisher = new TradePublisher();

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

    const pipeline = new MarketDataPipeline(
      queue,
      batchProcessor,
      rafScheduler,
      tickerEngine,
      orderBookEngine,
      tradeEngine,
      tickerPublisher,
      orderBookPublisher,
      tradePublisher,
      {
        getGroupingStep: (symbol) => useGroupingStore.getState().getStep(symbol),
        publishTickers: (tickers) => useTickerStore.getState().upsertMany(tickers),
        publishOrderBook: (vms) => useOrderBookViewStore.getState().upsertMany(vms),
        publishTrades: (snapshots) => useTradeStore.getState().upsertMany(snapshots),
      },
    );
    const stopPipeline = pipeline.start();

    // Recompute order book ViewModel immediately when the user changes grouping step,
    // bypassing the 100ms publish interval so the change feels instant.
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
      stopPipeline();
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
