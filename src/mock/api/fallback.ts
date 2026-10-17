// src/mock/api/fallback.ts
//
// Fallback data served by the /api/crypto/* route handlers when CoinGecko
// is unreachable (rate-limited, network failure, or unconfigured API key).
//
// Shapes here MUST match @/types/market — not the old mock files in
// src/mock/*. Those older files were shaped for direct component use and
// will be retired as each page moves to live data.
//
// Logo values are emoji characters, not URLs. Components should render them
// as text when `!logoUrl.startsWith("http")`. This avoids brittle hard-coded
// CDN URLs that could 404.

import type {
  GlobalMarketStats,
  MarketCoin,
  TrendingCoin,
} from "@/types/market";

export const fallbackMarkets: MarketCoin[] = [
  { id: "bitcoin",   symbol: "BTC",  name: "Bitcoin",   logoUrl: "₿",  price: 68420,   change24h:  2.4, marketCap: 1_340_000_000_000, volume24h: 28_000_000_000, rank: 1 },
  { id: "ethereum",  symbol: "ETH",  name: "Ethereum",  logoUrl: "Ξ",  price: 3845,    change24h: -0.8, marketCap:   462_000_000_000, volume24h: 15_000_000_000, rank: 2 },
  { id: "tether",    symbol: "USDT", name: "Tether",    logoUrl: "💵", price: 1.0,     change24h:  0.01, marketCap:   112_000_000_000, volume24h: 40_000_000_000, rank: 3 },
  { id: "bnb",       symbol: "BNB",  name: "BNB",       logoUrl: "🔶", price: 592,     change24h:  1.2, marketCap:    91_000_000_000, volume24h:  1_800_000_000, rank: 4 },
  { id: "solana",    symbol: "SOL",  name: "Solana",    logoUrl: "◎",  price: 142.3,   change24h:  5.1, marketCap:    64_000_000_000, volume24h:  3_200_000_000, rank: 5 },
  { id: "ripple",    symbol: "XRP",  name: "XRP",       logoUrl: "💧", price: 0.62,    change24h: -1.5, marketCap:    34_000_000_000, volume24h:  1_200_000_000, rank: 6 },
  { id: "usd-coin",  symbol: "USDC", name: "USD Coin",  logoUrl: "🔵", price: 1.0,     change24h:  0.0, marketCap:    33_000_000_000, volume24h:  6_500_000_000, rank: 7 },
  { id: "dogecoin",  symbol: "DOGE", name: "Dogecoin",  logoUrl: "🐕", price: 0.163,   change24h:  3.8, marketCap:    23_000_000_000, volume24h:  2_100_000_000, rank: 8 },
  { id: "cardano",   symbol: "ADA",  name: "Cardano",   logoUrl: "🔷", price: 0.482,   change24h: -2.1, marketCap:    17_000_000_000, volume24h:    520_000_000, rank: 9 },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", logoUrl: "🔺", price: 34.5,    change24h: -4.2, marketCap:    13_000_000_000, volume24h:    740_000_000, rank: 10 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", logoUrl: "🔗", price: 16.8,    change24h:  1.7, marketCap:     9_900_000_000, volume24h:    480_000_000, rank: 11 },
  { id: "polkadot",  symbol: "DOT",  name: "Polkadot",  logoUrl: "⚪", price: 7.25,    change24h: -0.3, marketCap:    10_000_000_000, volume24h:    310_000_000, rank: 12 },
  { id: "polygon",   symbol: "MATIC",name: "Polygon",   logoUrl: "🟣", price: 0.724,   change24h:  0.9, marketCap:     6_700_000_000, volume24h:    290_000_000, rank: 13 },
  { id: "uniswap",   symbol: "UNI",  name: "Uniswap",   logoUrl: "🦄", price: 9.87,    change24h:  2.3, marketCap:     5_900_000_000, volume24h:    180_000_000, rank: 14 },
  { id: "filecoin",  symbol: "FIL",  name: "Filecoin",  logoUrl: "📁", price: 5.67,    change24h: -9.2, marketCap:     2_700_000_000, volume24h:    420_000_000, rank: 15 },
];

export const fallbackGlobal: GlobalMarketStats = {
  totalMarketCap: 2_640_000_000_000,
  totalVolume: 98_500_000_000,
  btcDominance: 52.3,
  ethDominance: 17.5,
  activeCoins: 13_452,
  marketCapChange24h: 1.8,
};

export const fallbackTrending: TrendingCoin[] = [
  { id: "render-token",  symbol: "RNDR", name: "Render",     logoUrl: "🔘", rank: 32, price: 12.34,       change24h: 18.5 },
  { id: "arbitrum",      symbol: "ARB",  name: "Arbitrum",   logoUrl: "🔵", rank: 41, price: 1.23,        change24h: 12.7 },
  { id: "pepe",          symbol: "PEPE", name: "Pepe",       logoUrl: "🐸", rank: 28, price: 0.000012,    change24h: 10.2 },
  { id: "dogwifcoin",    symbol: "WIF",  name: "dogwifhat",  logoUrl: "🧢", rank: 55, price: 2.45,        change24h:  9.8 },
  { id: "ondo-finance",  symbol: "ONDO", name: "Ondo",       logoUrl: "🟡", rank: 68, price: 1.15,        change24h:  8.3 },
  { id: "jupiter-exchange-solana", symbol: "JUP", name: "Jupiter", logoUrl: "🪐", rank: 72, price: 0.85, change24h: 7.1 },
  { id: "celestia",      symbol: "TIA",  name: "Celestia",   logoUrl: "🌌", rank: 60, price: 6.42,        change24h: 6.4 },
];