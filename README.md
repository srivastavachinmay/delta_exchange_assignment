# Delta Exchange Trading Dashboard

A production-grade real-time crypto trading terminal targeting the [Delta Exchange](https://www.delta.exchange/) WebSocket API. Renders live order books, tickers, and trade feeds for six perpetual futures symbols simultaneously.

## Quick Start

```bash
npm install
npm run dev
```

The app opens at `http://localhost:3000`. It connects to the Delta Exchange WebSocket immediately on load — no authentication required for market data.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_WS_URL` | `ws://localhost:8080` | Delta Exchange WebSocket endpoint |
| `VITE_DEBUG_WS` | `false` | Enable verbose WebSocket message logging |


## Architecture

This project treats high-frequency WebSocket throughput as a first-class engineering problem. The full design is documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

**Short version:**

```
WebSocket (200+ msg/sec)
    ↓
MessageQueue  (ring buffer — enqueue is O(1))
    ↓
BatchProcessor  (coalesce per symbol × channel, per-frame)
    ↓
RAFScheduler  (drain once per animation frame at 60fps)
    ↓
Domain Engines  (TickerEngine / OrderBookEngine / TradeEngine)
    ↓
Zustand Stores  (one write per symbol per frame)
    ↓
React  (selector-isolated leaf components — one re-render per changed symbol)
```

React never handles WebSocket messages directly. It reads from stores via O(1) per-symbol selectors and renders at the browser's frame rate.

## Supported Symbols

BTCUSD · ETHUSD · XRPUSD · SOLUSD · PAXGUSD · DOGEUSD

## Tech Stack

- **React 19** + **TypeScript 7**
- **Zustand** (with `subscribeWithSelector` for surgical re-renders)
- **Vite** for development and build
- CSS Modules for component-scoped styles
- No charting libraries, no state management frameworks beyond Zustand

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build locally
npm run typecheck # TypeScript type check
npm run lint      # ESLint
```
