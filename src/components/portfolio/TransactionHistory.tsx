import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { transactionHistory } from "@/mock/portfolio";

export default function TransactionHistory() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text mb-4">Transaction History</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">Type</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">Asset</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Amount</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Price</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Total</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactionHistory.map((tx) => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-4">
                  <Badge variant={tx.type === "Buy" ? "success" : "danger"}>
                    {tx.type}
                  </Badge>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tx.logo}</span>
                    <div>
                      <p className="text-sm font-medium text-text">{tx.coin}</p>
                      <p className="text-xs text-secondary">{tx.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right text-sm text-text py-4">
                  {tx.amount.toLocaleString()} {tx.symbol}
                </td>
                <td className="text-right text-sm text-text py-4">
                  ${tx.price.toLocaleString()}
                </td>
                <td className="text-right text-sm font-medium text-text py-4">
                  ${tx.total.toLocaleString()}
                </td>
                <td className="text-right text-sm text-secondary py-4">
                  <span>{tx.date}</span>
                  <span className="block text-xs">{tx.time}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}