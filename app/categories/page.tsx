import { getServerUserId } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import CategoryManagement from "@/components/CategoryManagement";
import type { Category } from "@/types";

async function getCategories(userId: string | null): Promise<Category[]> {
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const [resPersonal, resGlobal] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true }),
      supabase.from("categories").select("*").is("user_id", null).order("name", { ascending: true }),
    ]);

    const personal = resPersonal.error ? [] : ((resPersonal.data as Category[]) || []);
    const global = resGlobal.error ? [] : ((resGlobal.data as Category[]) || []);
    return [...global, ...personal].sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const userId = await getServerUserId();
  const categories = await getCategories(userId);

  return (
    <main className="min-h-screen pb-32 px-4 py-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
        <p className="text-slate-400 text-sm">Kelola kategori transaksi</p>
      </div>

      <CategoryManagement initialCategories={categories} />
    </main>
  );
}
