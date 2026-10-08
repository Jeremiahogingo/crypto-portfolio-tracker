export interface Alert {
  id: string;
  coin: string;
  symbol: string;
  logo: string;
  condition: "above" | "below";
  price: number;
  currentPrice: number;
  enabled: boolean;
  createdAt: string;
}

export const initialAlerts: Alert[] = [
  {
    id: "a1",
    coin: "Bitcoin",
    symbol: "BTC",
    logo: "₿",
    condition: "above",
    price: 140000,
    currentPrice: 68420,
    enabled: true,
    createdAt: "2024-07-10",
  },
  {
    id: "a2",
    coin: "Ethereum",
    symbol: "ETH",
    logo: "Ξ",
    condition: "below",
    price: 2500,
    currentPrice: 3845,
    enabled: true,
    createdAt: "2024-07-08",
  },
  {
    id: "a3",
    coin: "Solana",
    symbol: "SOL",
    logo: "◎",
    condition: "above",
    price: 300,
    currentPrice: 142.3,
    enabled: false,
    createdAt: "2024-07-05",
  },
  {
    id: "a4",
    coin: "Cardano",
    symbol: "ADA",
    logo: "🔷",
    condition: "below",
    price: 0.4,
    currentPrice: 0.482,
    enabled: true,
    createdAt: "2024-07-03",
  },
];