import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import ProfileClient from "@/components/ProfileClient";
import { redirect } from "next/navigation";
import type { Wallet, Category } from "@/types";

async function getWallets(userId: string | null): Promise<Wallet[]> {
  if (!userId) return [];
  try {
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

async function getCategories(userId: string | null): Promise<Category[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error) throw error;
    return ((data as Category[]) || []).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export const metadata = {
  title: "Settings",
  description: "Manage your account and settings",
};

export default async function SettingsPage() {
  const userId = await getServerUserId();
  if (!userId) redirect("/login");

  const [wallets, categories] = await Promise.all([
    getWallets(userId),
    getCategories(userId),
  ]);

  return (
    <ProfileClient
      initialWallets={wallets}
      initialCategories={categories}
    />
  );
}
