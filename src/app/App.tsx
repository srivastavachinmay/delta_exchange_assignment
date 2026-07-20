import { WebSocketProvider } from './providers/WebSocketProvider';
import { AppShell } from './AppShell';

export function App() {
  return (
    <WebSocketProvider>
      <AppShell />
    </WebSocketProvider>
  );
}
