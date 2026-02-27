"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidates cache untuk halaman yang menampilkan daftar kategori.
 * Panggil setelah create/update/delete kategori agar Budget, Categories,
 * Dashboard, dan form transaksi menampilkan data terbaru.
 */
export async function revalidateCategoryPaths() {
  revalidatePath("/budget");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}
