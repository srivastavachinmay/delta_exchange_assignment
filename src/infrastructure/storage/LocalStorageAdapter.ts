/**
 * LocalStorageAdapter — implements StoragePort using browser localStorage.
 *
 * Wraps localStorage with:
 * - JSON serialization/deserialization
 * - Safe error handling (localStorage can throw in private browsing)
 * - Type-safe get() via generic
 *
 * Testability: inject MemoryStorageAdapter in tests to avoid browser API deps.
 */

import type { StoragePort } from '@/domain/ports/StoragePort';

export class LocalStorageAdapter implements StoragePort {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`[LocalStorageAdapter] failed to write key: ${key}`);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // No-op: if localStorage is unavailable, removal is a no-op
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // No-op
    }
  }
}

/**
 * In-memory StoragePort implementation for tests.
 * Zero browser API dependencies.
 */
export class MemoryStorageAdapter implements StoragePort {
  private readonly store = new Map<string, string>();

  get<T>(key: string): T | null {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    return JSON.parse(raw) as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
