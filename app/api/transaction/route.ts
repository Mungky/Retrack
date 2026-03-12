import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";
import { LIFETIME_PREMIUM_AMOUNT } from "@/lib/constants";

const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

export async function POST(request: Request) {
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

  const authString = Buffer.from(`${serverKey}:`, "utf-8").toString("base64");

  const orderId = `lifetime-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  let customerDetails = {
    first_name: "Customer",
    email: "customer@example.com",
    phone: "08123456789",
  };

  let grossAmount = LIFETIME_PREMIUM_AMOUNT;

  try {
    const bodyJson = await request.json().catch(() => ({}));
    if (bodyJson?.customer_details) {
      customerDetails = {
        ...customerDetails,
        ...bodyJson.customer_details,
      };
    }
    if (typeof bodyJson?.gross_amount === "number" && bodyJson.gross_amount > 0) {
      grossAmount = Math.round(bodyJson.gross_amount);
    }
  } catch {
    // ignore
  }

  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: customerDetails,
  };

  try {
    const response = await fetch(MIDTRANS_SNAP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Midtrans] Create transaction failed:", data);
      return NextResponse.json(
        { error: data.error_messages?.[0] || "Failed to create transaction" },
        { status: response.status }
      );
    }

    const supabase = await createClient();
    await supabase.from("payment_orders").insert({
      user_id: userId,
      order_id: orderId,
      gross_amount: grossAmount,
    });

    return NextResponse.json({ token: data.token, order_id: orderId });
  } catch (error) {
    console.error("[Midtrans] Request error:", error);
    return NextResponse.json(
      { error: "Failed to create payment transaction" },
      { status: 500 }
    );
  }
}
