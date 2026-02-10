import DashboardCard from "@/components/DashboardCard";
import WalletManagement from "@/components/WalletManagement";
import FloatingActionButton from "@/components/FloatingActionButton";
import QuickTransferButton from "@/components/QuickTransferButton";
import NotificationsBadge from "@/components/NotificationsBadge";
import RecentActivityCard from "@/components/RecentActivityCard";
import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import type { Transaction, Wallet } from "@/types";

async function getWallets(): Promise<Wallet[]> {
  try {
    const userId = await getServerUserId();
    
    if (!userId) {
      console.warn("No user_id found, returning empty wallets");
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as Wallet[]) || [];
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }
}

async function getTransactions(): Promise<Transaction[]> {
  try {
    const userId = await getServerUserId();
    
    if (!userId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

function calculateMonthlyStats(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  const income = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense };
}

export default async function Home() {
  const wallets = await getWallets();
  const transactions = await getTransactions();
  
  // Calculate total balance from wallets
  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  
  // Calculate monthly income and expense
  const { income: monthlyIncome, expense: monthlyExpense } = calculateMonthlyStats(transactions);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome back
            </h1>
            <p className="text-slate-400 text-sm">
              Here's your financial overview
            </p>
          </div>
          <NotificationsBadge />
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="space-y-6">
        {/* Main Dashboard Card - Full Width */}
        <DashboardCard
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
        />

        {/* Quick Actions Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Quick Transfer */}
          <QuickTransferButton />

          {/* Recent Activity */}
          <RecentActivityCard />
        </div>

        {/* Wallet Management Section */}
        <WalletManagement initialWallets={wallets} />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </main>
  );
}
