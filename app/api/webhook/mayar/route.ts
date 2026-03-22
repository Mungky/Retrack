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
    
    // REVERT: Mengikuti konfirmasi user bahwa nama kolom aslinya adalah camelCase 'isPro'
    const updateData = { isPro: true, theme: "sultan" };
    
    // Mayar kadang mengirim 'custom_field' atau 'customField' atau 'metadata.custom_field'
    const identifier = customField || data.customField || data.metadata?.custom_field || payload.custom_field;

    console.log(`[Mayar Webhook] Processing event: ${payload.event}. Identifier: ${identifier || customerEmail}`);

    const userQuery = admin.from("users").update(updateData);

    if (identifier && identifier.length > 20) { 
      userQuery.eq("id", identifier);
    } else if (customerEmail) {
      userQuery.eq("email", customerEmail);
    } else {
      console.warn("[Mayar Webhook] No valid identifier found in payload");
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
