const formatterCache = new Map<number, Intl.NumberFormat>();

function getPriceFormatter(precision: number): Intl.NumberFormat {
  let f = formatterCache.get(precision);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
    formatterCache.set(precision, f);
  }
  return f;
}

export function formatOrderBookPrice(price: number, precision: number): string {
  return getPriceFormatter(precision).format(price);
}
