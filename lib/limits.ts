// Sanity bounds for weekly report figures. Generous enough that no real
// congregation would ever hit them, but tight enough to keep bad input
// (typos, decimal points, copy-paste mistakes) from ever reaching Postgres —
// an Int column overflow or an absurd Decimal throws an uncaught error deep
// in the DB layer instead of a friendly validation message.
export const MAX_HEADCOUNT = 1_000_000; // regulars / VIP, per Sunday
export const MAX_GIVING = 999_999_999; // PHP, per Sunday
