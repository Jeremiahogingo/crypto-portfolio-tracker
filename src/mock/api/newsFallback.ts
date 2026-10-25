// src/mock/api/newsFallback.ts
//
// Fallback news used by the /api/crypto/news route handler when all RSS
// sources fail (offline development, upstream outage, CI environment).
//
// Shaped to match NewsArticle exactly — no transformation needed in the
// route handler. Timestamps are relative to import time so the UI's
// "X hours ago" labels remain sensible regardless of when this file loads.

import type { NewsArticle } from "@/types/news";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

export const fallbackNews: NewsArticle[] = [
  {
    id: "fallback-1",
    title: "Bitcoin ETF inflows reach new all-time high of $2.4B",
    description:
      "Institutional investors poured billions into spot Bitcoin ETFs this week, signalling continued confidence despite recent volatility.",
    url: "https://www.coindesk.com/",
    source: "CoinDesk",
    publishedAt: hoursAgo(2),
    category: "Bitcoin",
    author: "Sarah Chen",
  },
  {
    id: "fallback-2",
    title: "Ethereum core devs confirm Dencun upgrade date for mainnet",
    description:
      "The long-awaited upgrade introduces proto-danksharding and dramatically reduces Layer 2 transaction costs.",
    url: "https://cointelegraph.com/",
    source: "Cointelegraph",
    publishedAt: hoursAgo(4),
    category: "Ethereum",
    author: "Michael Park",
  },
  {
    id: "fallback-3",
    title: "Solana DeFi TVL surges past $5 billion milestone",
    description:
      "Total value locked on Solana has doubled in the last month, driven by memecoin activity and new lending protocols.",
    url: "https://www.theblock.co/",
    source: "The Block",
    publishedAt: hoursAgo(6),
    category: "DeFi",
    author: "Lisa Wang",
  },
  {
    id: "fallback-4",
    title: "SEC approves new regulatory framework for crypto exchanges",
    description:
      "The framework establishes clear compliance guidelines for centralised exchanges operating in the United States.",
    url: "https://www.coindesk.com/",
    source: "CoinDesk",
    publishedAt: hoursAgo(8),
    category: "Regulation",
    author: "David Kim",
  },
  {
    id: "fallback-5",
    title: "Chainlink launches cross-chain interoperability protocol",
    description:
      "CCIP goes live on mainnet, enabling secure transfers between major blockchains for enterprise use cases.",
    url: "https://cointelegraph.com/",
    source: "Cointelegraph",
    publishedAt: hoursAgo(12),
    category: "Altcoins",
    author: "James Lee",
  },
  {
    id: "fallback-6",
    title: "NFT market shows signs of revival with $1.2B weekly volume",
    description:
      "Blue-chip collections see renewed interest from collectors after months of declining activity.",
    url: "https://www.theblock.co/",
    source: "The Block",
    publishedAt: hoursAgo(18),
    category: "NFT",
    author: "Emma Stone",
  },
];