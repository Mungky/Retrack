import { NextResponse } from "next/server";

const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

export async function POST() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json(
      { error: "MIDTRANS_SERVER_KEY is not configured" },
      { status: 500 }
    );
  }

  const authString = Buffer.from(`${serverKey}:`, "utf-8").toString("base64");

  const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: 50000,
    },
    customer_details: {
      first_name: "Customer",
      email: "customer@example.com",
      phone: "08123456789",
    },
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

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("[Midtrans] Request error:", error);
    return NextResponse.json(
      { error: "Failed to create payment transaction" },
      { status: 500 }
    );
  }
}
