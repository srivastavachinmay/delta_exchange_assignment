import { useFocusedSymbolStore } from '@/app/stores/focusedSymbolStore';
import { useTradesSubscription } from './hooks/useTradesSubscription';
import { TradesPanel } from './components/TradesPanel';

export function TradesFeature() {
  useTradesSubscription();
  const symbol = useFocusedSymbolStore((s) => s.focusedSymbol);

  return <TradesPanel symbol={symbol} />;
}
