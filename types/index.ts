import type { User as SupabaseUser } from "@supabase/supabase-js";

export type WalletType = "bank" | "ewallet" | "cash";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: WalletType;
  user_id?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color?: string | null;
  type?: CategoryType;
  user_id?: string;
}

export interface WalletReference {
  id: string;
  name: string;
}

export interface CategoryReference {
  id: string;
  name: string;
  icon: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string;
  category_id: string | null;
  source_wallet_id: string | null;
  destination_wallet_id: string | null;
  user_id?: string;
  category?: CategoryReference | null;
  source_wallet?: WalletReference | null;
  destination_wallet?: WalletReference | null;
}

export type User = SupabaseUser;
