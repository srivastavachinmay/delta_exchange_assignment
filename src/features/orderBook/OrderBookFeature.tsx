import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { useOrderBookSubscription } from './hooks/useOrderBookSubscription';
import { OrderBook } from './components/OrderBook';

export function OrderBookFeature() {
  useOrderBookSubscription();
  const symbol = useFocusedSymbolStore((s) => s.focusedSymbol);

  return <OrderBook symbol={symbol} />;
}
