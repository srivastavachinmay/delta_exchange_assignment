import { useEffect, type ReactNode } from 'react';
import { wsManager } from '@/infrastructure/websocket/WebSocketManager';
import { SubscriptionManager } from '@/infrastructure/websocket/SubscriptionManager';
import { WebSocketAdapter } from '@/infrastructure/websocket/WebSocketAdapter';
import { LocalStorageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';
import { MessageRouter } from '@/application/MessageRouter';
import { SubscriptionHandler } from '@/application/SubscriptionHandler';
import { FocusSymbolUseCase } from '@/application/useCases/FocusSymbolUseCase';
import { TickerEngine } from '@/domain/services/TickerEngine';
import { STORAGE_KEYS } from '@/domain/ports/StoragePort';
import { SUPPORTED_SYMBOLS } from '@/shared/constants/symbols';
import { useConnectionStore } from '@/app/stores/connectionStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';
import { useTickerStore } from '@/app/stores/tickerStore';
import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';

interface Props {
  readonly children: ReactNode;
}

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    // --- Application layer ---
    const subscriptionHandler = new SubscriptionHandler({
      onAcknowledge: (symbols, channels) =>
        useSubscriptionStore.getState().acknowledge(symbols, channels),
      onRemove: (symbols, channels) =>
        useSubscriptionStore.getState().remove(symbols, channels),
    });

    const router = new MessageRouter(subscriptionHandler);

    // --- Infrastructure layer ---
    const storageAdapter = new LocalStorageAdapter();

    const subscriptionManager = new SubscriptionManager(wsManager);
    subscriptionManager.setCallbacks({
      onDesiredAdded: (symbols, channel) =>
        useSubscriptionStore.getState().addDesired(symbols, [channel]),
      onDesiredRemoved: (symbols, channel) =>
        useSubscriptionStore.getState().removeDesired(symbols, [channel]),
    });

    const adapter = new WebSocketAdapter(router, wsManager, subscriptionManager);
    adapter.initialize();

    // --- Ticker domain wiring ---
    const tickerEngine = new TickerEngine();

    adapter.onTicker((raw) => {
      try {
        const ticker = tickerEngine.process(raw);
        const prev = useTickerStore.getState().tickers.get(raw.symbol);
        if (tickerEngine.isValidUpdate(ticker, prev)) {
          useTickerStore.getState().upsert(ticker);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[TickerEngine] malformed message dropped:', err);
        }
      }
    });

    // --- Focused symbol: restore from storage on mount, persist on change ---
    // FocusSymbolUseCase owns restore logic; persistence goes via direct subscription
    // (avoids a feedback loop if execute() were called from the subscription).
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

    // Connect and subscribe to v2/ticker for all symbols.
    // SubscriptionManager tracks desired set and replays on every reconnect.
    wsManager.connect();
    SUPPORTED_SYMBOLS.forEach((symbol) => {
      adapter.subscribe(symbol, 'ticker');
    });

    return () => {
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
