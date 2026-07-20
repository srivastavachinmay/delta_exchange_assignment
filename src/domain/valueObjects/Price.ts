/**
 * Price — branded numeric type.
 *
 * Prevents accidentally passing a raw number where a validated Price is expected.
 * The brand lives only at compile time — zero runtime overhead.
 *
 * Usage:
 *   const p: Price = createPrice(42_000.5)  // validated
 *   const raw: number = 42_000.5
 *   fn(raw)  // TS error if fn expects Price
 */

declare const __priceBrand: unique symbol;

export type Price = number & { readonly [__priceBrand]: 'Price' };

export function createPrice(value: number): Price {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Invalid price: ${value}`);
  }
  return value as Price;
}

export function priceToNumber(price: Price): number {
  return price as number;
}
