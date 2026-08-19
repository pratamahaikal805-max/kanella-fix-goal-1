import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyTransactionStatus } from "@/lib/midtrans";

// Endpoint ini didaftarkan sebagai "Payment Notification URL" di dashboard Midtrans.
// Dua lapis verifikasi dipakai supaya webhook tidak bisa dipalsukan orang luar:
// 1) Cocokkan signature_key (hash dari order_id + status_code + gross_amount + server_key).
// 2) Query ulang status transaksi LANGSUNG ke server Midtrans (bukan percaya body request).

export async function POST(req: Request) {
  const body = await req.json();
  const { order_id, status_code, gross_amount, signature_key } = body;

  if (!order_id || !signature_key) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest("hex");

  if (expectedSignature !== signature_key) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 403 });
  }

  // Jangan percaya transaction_status dari body mentah — tanya ulang ke Midtrans.
  const verified = await verifyTransactionStatus(order_id);
  const transactionStatus = verified.transaction_status;
  const fraudStatus = verified.fraud_status;

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: order_id },
    include: { order: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Transaksi tidak dikenali." }, { status: 404 });
  }

  let newOrderStatus = payment.order.status;
  let newPaymentStatus = payment.status;

  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    if (fraudStatus === "accept" || !fraudStatus) {
      newPaymentStatus = "settlement";
      newOrderStatus = "DIBAYAR";
    }
  } else if (transactionStatus === "pending") {
    newPaymentStatus = "pending";
  } else if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire"
  ) {
    newPaymentStatus = transactionStatus;
    newOrderStatus = "DIBATALKAN";
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newPaymentStatus,
      paymentType: verified.payment_type,
      transactionId: verified.transaction_id,
      rawNotification: JSON.stringify(verified),
    },
  });

  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: newOrderStatus },
  });

  return NextResponse.json({ received: true });
}
