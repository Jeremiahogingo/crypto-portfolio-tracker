export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat cards will go here later */}
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <p className="text-sm text-secondary">Portfolio Value</p>
          <p className="text-2xl font-bold text-text mt-1">$82,440</p>
          <p className="text-xs text-success">+8.42%</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <p className="text-sm text-secondary">Today&apos;s Profit</p>
          <p className="text-2xl font-bold text-success mt-1">+$1,854</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <p className="text-sm text-secondary">Assets</p>
          <p className="text-2xl font-bold text-text mt-1">24 Coins</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/5">
          <p className="text-sm text-secondary">ROI</p>
          <p className="text-2xl font-bold text-success mt-1">+41.7%</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-5 border border-white/5 h-64">
          <p className="text-sm text-secondary">Portfolio Growth (chart placeholder)</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/5 h-64">
          <p className="text-sm text-secondary">Asset Allocation (chart placeholder)</p>
        </div>
      </div>
    </div>
  );
}