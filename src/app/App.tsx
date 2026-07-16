/**
 * App — root component. Thin by design.
 *
 * Responsibilities:
 * - Mount providers in the correct order
 * - Render the AppShell
 *
 * No state. No logic. If there's business logic here, it belongs in a
 * use case or a store.
 */

import { WebSocketProvider } from './providers/WebSocketProvider';
import { AppShell } from '@/features/layout/AppShell';

export function App() {
  return (
    <WebSocketProvider>
      <AppShell />
    </WebSocketProvider>
  );
}
