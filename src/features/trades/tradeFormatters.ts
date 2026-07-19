export function formatPrice(price: number, precision: number): string {
  const fixed = price.toFixed(precision);
  const dotIdx = fixed.indexOf('.');
  const int = dotIdx === -1 ? fixed : fixed.slice(0, dotIdx);
  const dec = dotIdx === -1 ? undefined : fixed.slice(dotIdx + 1);
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}

export function formatSize(size: number, maxDecimals = 4): string {
  return size.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });
}

export function formatTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}
