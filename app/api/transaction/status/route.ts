import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";

const MIDTRANS_STATUS_URL = "https://api.sandbox.midtrans.com/v2";

export async function GET(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json(
      { error: "MIDTRANS_SERVER_KEY is not configured" },
      { status: 500 }
    );
  }

  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderIdParam = searchParams.get("order_id");

  const authString = Buffer.from(`${serverKey}:`, "utf-8").toString("base64");

  try {
    let orderIds: string[] = [];

    if (orderIdParam) {
      orderIds = [orderIdParam];
    } else {
      const supabase = await createClient();
      const { data: orders } = await supabase
        .from("payment_orders")
        .select("order_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      orderIds = (orders ?? []).map((o) => o.order_id);
    }

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada transaksi yang ditemukan.",
      });
    }

    for (const orderId of orderIds) {
      const res = await fetch(`${MIDTRANS_STATUS_URL}/${orderId}/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
      });

      const data = await res.json();

      if (res.ok && data?.transaction_status) {
        const status = data.transaction_status;
        if (status === "settlement" || status === "capture") {
          const supabase = await createClient();
          await supabase.from("users").update({ isPro: true }).eq("id", userId);

          return NextResponse.json({
            success: true,
            message: "Akun Premium Berhasil Dipulihkan!",
            order_id: orderId,
          });
        }
      }
    }

    return NextResponse.json({
      success: false,
      message: "Tidak ada transaksi yang ditemukan.",
    });
  } catch (error) {
    console.error("[Midtrans] Status check error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa status pembayaran." },
      { status: 500 }
    );
  }
}
