export const portfolioSummary = {
  totalValue: 82440,
  profitToday: 1854,
  assetsCount: 24,
  roi: 41.7,
  valueChangePercent: 8.42,
};

export const holdings = [
  {
    id: 1,
    coin: "Bitcoin",
    symbol: "BTC",
    logo: "₿",
    price: 68420.5,
    holdings: 0.85,
    value: 58157.43,
    change24h: 2.4,
    roi: 38.2,
    sparklineData: [62000, 63500, 65000, 66000, 67000, 68000, 68420],
  },
  {
    id: 2,
    coin: "Ethereum",
    symbol: "ETH",
    logo: "Ξ",
    price: 3845.2,
    holdings: 4.2,
    value: 16149.84,
    change24h: -0.8,
    roi: 24.6,
    sparklineData: [3900, 3880, 3860, 3845, 3830, 3840, 3845],
  },
  {
    id: 3,
    coin: "Solana",
    symbol: "SOL",
    logo: "◎",
    price: 142.3,
    holdings: 45,
    value: 6403.5,
    change24h: 5.1,
    roi: 52.3,
    sparklineData: [135, 137, 139, 140, 141, 142, 142.3],
  },
  {
    id: 4,
    coin: "BNB",
    symbol: "BNB",
    logo: "🔶",
    price: 592.1,
    holdings: 2.5,
    value: 1480.25,
    change24h: 1.2,
    roi: 18.9,
    sparklineData: [580, 585, 588, 590, 591, 592, 592.1],
  },
  {
    id: 5,
    coin: "Cardano",
    symbol: "ADA",
    logo: "🔷",
    price: 0.482,
    holdings: 5000,
    value: 2410,
    change24h: -2.1,
    roi: -5.4,
    sparklineData: [0.49, 0.488, 0.486, 0.484, 0.483, 0.482, 0.482],
  },
  {
    id: 6,
    coin: "Polygon",
    symbol: "MATIC",
    logo: "🟣",
    price: 0.724,
    holdings: 3000,
    value: 2172,
    change24h: 0.9,
    roi: 12.7,
    sparklineData: [0.71, 0.715, 0.72, 0.722, 0.723, 0.724, 0.724],
  },
];

export const portfolioGrowth = [
  { month: "Jan", value: 62000 },
  { month: "Feb", value: 64000 },
  { month: "Mar", value: 68000 },
  { month: "Apr", value: 72000 },
  { month: "May", value: 76000 },
  { month: "Jun", value: 80000 },
  { month: "Jul", value: 82440 },
];

export const assetAllocation = [
  { name: "Bitcoin", value: 45, color: "#F7931A" },
  { name: "Ethereum", value: 25, color: "#627EEA" },
  { name: "Solana", value: 12, color: "#9945FF" },
  { name: "BNB", value: 8, color: "#F0B90B" },
  { name: "Others", value: 10, color: "#64748B" },
];

export const topMovers = [
  { symbol: "RNDR", price: 12.34, change: 18.5 },
  { symbol: "ARB", price: 1.23, change: 12.7 },
  { symbol: "APT", price: 9.87, change: -9.2 },
  { symbol: "FIL", price: 5.67, change: -7.8 },
];

export const marketNews = [
  {
    id: 1,
    title: "Bitcoin ETF inflows reach new all-time high",
    description: "Institutional investors poured $2.4B into spot Bitcoin ETFs...",
    source: "CoinDesk",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Ethereum core devs announce Dencun upgrade date",
    description: "The long-awaited upgrade will bring proto-danksharding...",
    source: "The Block",
    time: "4 hours ago",
  },
  {
    id: 3,
    title: "Solana DeFi TVL surges past $5 billion",
    description: "Solana's total value locked has doubled in the last month...",
    source: "Decrypt",
    time: "6 hours ago",
  },
];