/**
 * Money is integer cents everywhere. These helpers are the only place a price
 * turns into a string, so the feed, the detail screen and the chat header all
 * format the same way.
 */

/** `4500` -> `"$45"`, `4550` -> `"$45.50"`. Whole dollars drop the `.00`. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const grouped = dollars.toLocaleString('en-US');
  return remainder === 0
    ? `${sign}$${grouped}`
    : `${sign}$${grouped}.${remainder.toString().padStart(2, '0')}`;
}

/** Parses what a student types into the price field. Returns null if unusable. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** `12000` and `4500` -> `63` (percent off), or null when there is no discount. */
export function percentOff(compareAtCents: number | null, priceCents: number): number | null {
  if (compareAtCents === null || compareAtCents <= priceCents || compareAtCents <= 0) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
