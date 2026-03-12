import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Midtrans HTTP Notification (Webhook) handler.
 * Dipanggil oleh Midtrans saat status transaksi berubah (settlement, capture, dll).
 * Mengatasi celah: user bayar tapi tutup browser sebelum onSuccess selesai.
 *
 * Konfigurasi: Set Payment Notification URL di Midtrans Dashboard ke:
 * https://your-domain.com/api/webhook/midtrans
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const orderId = body?.order_id as string | undefined;
    const transactionStatus = body?.transaction_status as string | undefined;
    const fraudStatus = body?.fraud_status as string | undefined;
    const customField1 = body?.custom_field1 as string | undefined;

    if (!orderId) {
      console.warn("[Midtrans Webhook] Missing order_id");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const isPaid =
      transactionStatus === "settlement" || transactionStatus === "capture";
    const fraudOk = !fraudStatus || fraudStatus === "accept";

    if (!isPaid || !fraudOk) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    let userId: string | null = customField1 || null;

    if (!userId) {
      const admin = createAdminClient();
      const { data: order } = await admin
        .from("payment_orders")
        .select("user_id")
        .eq("order_id", orderId)
        .single();

      userId = (order as { user_id?: string } | null)?.user_id ?? null;
    }

    if (!userId) {
      console.warn("[Midtrans Webhook] No user_id for order:", orderId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("users")
      .update({ isPro: true, theme: "sultan" })
      .eq("id", userId);

    if (error) {
      console.error("[Midtrans Webhook] Update user failed:", error);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log("[Midtrans Webhook] Upgraded user to Pro:", userId, orderId);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Midtrans Webhook] Error:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
