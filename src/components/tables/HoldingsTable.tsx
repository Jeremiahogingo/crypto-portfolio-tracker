"use client";

import { holdings } from "@/mock/dashboard";
import Badge from "@/components/ui/Badge";

export default function HoldingsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Coin
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Price
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Holdings
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Value
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              24H
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              ROI
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr
              key={holding.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg">
                    {holding.logo}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text">
                      {holding.coin}
                    </p>
                    <p className="text-xs text-secondary">{holding.symbol}</p>
                  </div>
                </div>
              </td>
              <td className="text-right text-sm text-text">
                ${holding.price.toLocaleString()}
              </td>
              <td className="text-right text-sm text-text">
                {holding.holdings.toLocaleString()} {holding.symbol}
              </td>
              <td className="text-right text-sm font-medium text-text">
                ${holding.value.toLocaleString()}
              </td>
              <td className="text-right">
                <Badge variant={holding.change24h > 0 ? "success" : "danger"}>
                  {holding.change24h > 0 ? "+" : ""}
                  {holding.change24h}%
                </Badge>
              </td>
              <td className="text-right">
                <span
                  className={`text-sm ${
                    holding.roi > 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {holding.roi > 0 ? "+" : ""}
                  {holding.roi}%
                </span>
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="text-xs text-secondary hover:text-text">
                    ✏️
                  </button>
                  <button className="text-xs text-secondary hover:text-danger">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}