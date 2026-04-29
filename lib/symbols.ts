// Symbol configuration for pip / point / lot calculations.
// Values are reasonable industry defaults — adjust per broker if needed.

export type SymbolKey = "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "BTCUSD" | "US30" | "NAS100"

export type SymbolConfig = {
  symbol: SymbolKey
  label: string
  category: "Forex" | "Metals" | "Crypto" | "Indices"
  /** Smallest "pip" increment used for distance reporting. */
  pipSize: number
  /** Smallest tick / point increment (sub-pip). */
  pointSize: number
  /** USD value per 1 pip per 1.0 standard lot. */
  pipValuePerLot: number
  /** Decimal places for price display. */
  decimals: number
  /** Pip label: "pips" for forex/metals, "points" for indices/crypto. */
  pipLabel: "pips" | "points"
}

export const SYMBOL_CONFIGS: Record<SymbolKey, SymbolConfig> = {
  XAUUSD: {
    symbol: "XAUUSD",
    label: "XAUUSD — Gold",
    category: "Metals",
    pipSize: 0.1,
    pointSize: 0.01,
    pipValuePerLot: 10,
    decimals: 2,
    pipLabel: "pips",
  },
  EURUSD: {
    symbol: "EURUSD",
    label: "EURUSD",
    category: "Forex",
    pipSize: 0.0001,
    pointSize: 0.00001,
    pipValuePerLot: 10,
    decimals: 5,
    pipLabel: "pips",
  },
  GBPUSD: {
    symbol: "GBPUSD",
    label: "GBPUSD",
    category: "Forex",
    pipSize: 0.0001,
    pointSize: 0.00001,
    pipValuePerLot: 10,
    decimals: 5,
    pipLabel: "pips",
  },
  USDJPY: {
    symbol: "USDJPY",
    label: "USDJPY",
    category: "Forex",
    pipSize: 0.01,
    pointSize: 0.001,
    // ~1000 JPY per pip per lot ≈ ~$6.67 at 150 USDJPY. We use a stable approximation.
    pipValuePerLot: 6.67,
    decimals: 3,
    pipLabel: "pips",
  },
  BTCUSD: {
    symbol: "BTCUSD",
    label: "BTCUSD — Bitcoin",
    category: "Crypto",
    pipSize: 1,
    pointSize: 0.01,
    pipValuePerLot: 1,
    decimals: 2,
    pipLabel: "points",
  },
  US30: {
    symbol: "US30",
    label: "US30 — Dow",
    category: "Indices",
    pipSize: 1,
    pointSize: 0.1,
    pipValuePerLot: 1,
    decimals: 1,
    pipLabel: "points",
  },
  NAS100: {
    symbol: "NAS100",
    label: "NAS100 — Nasdaq",
    category: "Indices",
    pipSize: 1,
    pointSize: 0.1,
    pipValuePerLot: 1,
    decimals: 1,
    pipLabel: "points",
  },
}

export const SYMBOL_KEYS = Object.keys(SYMBOL_CONFIGS) as SymbolKey[]

export function getSymbolConfig(symbol: string): SymbolConfig {
  return SYMBOL_CONFIGS[symbol as SymbolKey] ?? SYMBOL_CONFIGS.EURUSD
}

export function formatPrice(value: number, symbol: string): string {
  const cfg = getSymbolConfig(symbol)
  if (!Number.isFinite(value)) return "—"
  return value.toFixed(cfg.decimals)
}
