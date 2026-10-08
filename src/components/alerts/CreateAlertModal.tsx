"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Alert } from "@/mock/alerts";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (alert: Alert) => void;
}

const coinOptions = [
  { symbol: "BTC", name: "Bitcoin", logo: "₿", price: 68420 },
  { symbol: "ETH", name: "Ethereum", logo: "Ξ", price: 3845 },
  { symbol: "SOL", name: "Solana", logo: "◎", price: 142.3 },
  { symbol: "ADA", name: "Cardano", logo: "🔷", price: 0.482 },
  { symbol: "DOGE", name: "Dogecoin", logo: "🐕", price: 0.163 },
  { symbol: "LINK", name: "Chainlink", logo: "🔗", price: 16.8 },
];

export default function CreateAlertModal({
  isOpen,
  onClose,
  onCreate,
}: CreateAlertModalProps) {
  const [coinSymbol, setCoinSymbol] = useState("BTC");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  const handleSubmit = () => {
    const coin = coinOptions.find((c) => c.symbol === coinSymbol);
    if (!coin || !price) return;

    const newAlert: Alert = {
      id: `a${Date.now()}`,
      coin: coin.name,
      symbol: coin.symbol,
      logo: coin.logo,
      condition,
      price: parseFloat(price),
      currentPrice: coin.price,
      enabled: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onCreate(newAlert);
    setPrice("");
    setCoinSymbol("BTC");
    setCondition("above");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Alert">
      <div className="space-y-4">
        {/* Coin */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Coin
          </label>
          <select
            value={coinSymbol}
            onChange={(e) => setCoinSymbol(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
          >
            {coinOptions.map((coin) => (
              <option key={coin.symbol} value={coin.symbol}>
                {coin.name} ({coin.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Condition
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCondition("above")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                condition === "above"
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Price Above
            </button>
            <button
              onClick={() => setCondition("below")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                condition === "below"
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Price Below
            </button>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Target Price (USD)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter target price"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Alert
          </Button>
        </div>
      </div>
    </Modal>
  );
}