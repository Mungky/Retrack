import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

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
        console.warn("[Mayar Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    
    // Hanya proses jika eventnya berhasil (payment.received atau status PAID)
    const isPaid = 
      payload.event === "payment.received" || 
      payload.event === "transaction.paid" || 
      payload.data?.status === "PAID" || 
      payload.statusCode === "PAID";

    if (!isPaid) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const data = payload.data || payload;
    const customerEmail = data.customer?.email || data.email;
    const customField = data.custom_field || data.customField; 

    // Cari user berdasarkan custom_field (id) atau email
    if (!customField && !customerEmail) {
      console.warn("[Mayar Webhook] No customer identifier (email or custom_field) found in payload");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const admin = createAdminClient();
    
    let userQuery = admin.from("users").update({ isPro: true, theme: "sultan" });
    
    if (customField && customField.length > 10) { 
      // Asumsikan custom_field berisi uuid Supabase (panjangnya lebih dari 10 karakter)
      userQuery = userQuery.eq("id", customField);
    } else if (customerEmail) {
      userQuery = userQuery.eq("email", customerEmail);
    }

    const { error } = await userQuery;

    if (error) {
      console.error("[Mayar Webhook] Update user failed:", error);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`[Mayar Webhook] Upgraded user to Pro: ${customField || customerEmail}`);
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Mayar Webhook] Error processing payload:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
