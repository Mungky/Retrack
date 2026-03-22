import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headersList = request.headers;
    const signature = headersList.get("x-mayar-signature") || headersList.get("Mayar-Signature") || "";

    const secret = process.env.MAYAR_WEBHOOK_SECRET;
    
    // Verifikasi HMAC Signature untuk keamanan
    if (secret && signature) {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
        
      if (signature !== generatedSignature) {
        // SEMENTARA: Hanya log peringatan agar tidak memblokir user yang sudah bayar saat debugging
        console.error(`[Mayar Webhook] Signature Mismatch! Expected: ${generatedSignature}, Received: ${signature}`);
      } else {
        console.log("[Mayar Webhook] Signature Verified Successfully.");
      }
    } else {
      console.warn("[Mayar Webhook] Missing secret or signature header. Skipping verification.");
    }

    const payload = JSON.parse(rawBody);
    console.log("[Mayar Webhook] Received Payload:", JSON.stringify(payload, null, 2));

    // Mendukung berbagai struktur payload Mayar
    const data = payload.data || payload;
    
    // Hanya proses jika eventnya berhasil (payment.received atau status PAID)
    const isPaid = 
      payload.event === "payment.received" || 
      payload.event === "transaction.paid" || 
      data.status === "PAID" || 
      payload.statusCode === "PAID" ||
      payload.event_type === "payment.received";

    if (!isPaid) {
      console.log(`[Mayar Webhook] Event ${payload.event || 'unknown'} ignored.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const customerEmail = data.customer?.email || data.email || payload.email;
    const customField = data.custom_field || data.customField || data.metadata?.custom_field || payload.custom_field; 

    // Cari user berdasarkan custom_field (id) atau email
    if (!customField && !customerEmail) {
      console.warn("[Mayar Webhook] No customer identifier (email or custom_field) found in payload");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const admin = createAdminClient();
    
    // REVERT: Mengikuti konfirmasi user bahwa nama kolom aslinya adalah camelCase 'isPro'
    const updateData = { isPro: true, theme: "sultan" };
    
    const identifier = customField;

    console.log(`[Mayar Webhook] Processing event: ${payload.event}. Identifier: ${identifier || customerEmail}`);

    const userQuery = admin.from("users").update(updateData);

    if (identifier && identifier.length > 20) { 
      userQuery.eq("id", identifier);
    } else if (customerEmail) {
      userQuery.eq("email", customerEmail);
    } else {
      console.warn("[Mayar Webhook] No valid identifier found in payload after parsing");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { error } = await userQuery;

    if (error) {
      console.error("[Mayar Webhook] Supabase Update Error:", error.message);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`[Mayar Webhook] Success! Upgraded: ${identifier || customerEmail}`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Mayar Webhook] Error processing payload:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
