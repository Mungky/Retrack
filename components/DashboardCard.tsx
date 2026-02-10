interface DashboardCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export default function DashboardCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
}: DashboardCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const netFlow = monthlyIncome - monthlyExpense;

  return (
    <div 
      className="relative overflow-hidden rounded-3xl border border-white/10 p-8 group hover:scale-[1.02] transition-transform duration-300" 
      style={{ 
        background: 'linear-gradient(135deg, rgb(20, 27, 61) 0%, rgb(26, 35, 66) 50%, rgb(15, 23, 42) 100%)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-400 mb-2 tracking-wider uppercase">
            Total Balance
          </p>
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
            {formatCurrency(totalBalance)}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Income */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 p-4 backdrop-blur-sm">
            <p className="text-xs text-emerald-400/80 mb-1.5 font-medium">Income</p>
            <p className="text-lg font-bold text-emerald-300">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Expense */}
          <div className="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-4 backdrop-blur-sm">
            <p className="text-xs text-red-400/80 mb-1.5 font-medium">Expense</p>
            <p className="text-lg font-bold text-red-300">
              {formatCurrency(monthlyExpense)}
            </p>
          </div>

          {/* Net Flow */}
          <div className={`rounded-2xl bg-gradient-to-br ${
            netFlow >= 0 
              ? 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' 
              : 'from-orange-500/20 to-orange-600/10 border-orange-500/30'
          } border p-4 backdrop-blur-sm`}>
            <p className={`text-xs mb-1.5 font-medium ${
              netFlow >= 0 ? 'text-cyan-400/80' : 'text-orange-400/80'
            }`}>
              Net Flow
            </p>
            <p className={`text-lg font-bold ${
              netFlow >= 0 ? 'text-cyan-300' : 'text-orange-300'
            }`}>
              {formatCurrency(Math.abs(netFlow))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
