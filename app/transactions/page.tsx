import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import TransactionsList from "@/components/TransactionsList";
import type { Transaction } from "@/types";

async function getTransactions(userId: string | null): Promise<Transaction[]> {
  if (!userId) {
    return [];
  }

  try {
    const supabase = await createClient();

    // Fetch transactions with joins
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        type,
        date,
        description,
        category_id,
        source_wallet_id,
        destination_wallet_id,
        category:categories(id, name, icon),
        source_wallet:wallets!source_wallet_id(id, name),
        destination_wallet:wallets!destination_wallet_id(id, name)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;

    return (transactions as unknown as Transaction[]) || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export default async function TransactionsPage() {
  const userId = await getServerUserId();
  const transactions = await getTransactions(userId);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-white/60 text-sm">Riwayat transaksi Anda</p>
      </div>

      <TransactionsList initialTransactions={transactions} />
    </main>
  );
}
