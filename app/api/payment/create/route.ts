import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";

export async function POST(req: Request) {
  const { orderId } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, table: true, payment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }
  if (order.status !== "MENUNGGU_PEMBAYARAN") {
    return NextResponse.json(
      { error: "Order ini sudah diproses atau dibatalkan." },
      { status: 400 }
    );
  }

  // Kalau customer klik bayar lagi (mis. reload halaman) dan sudah ada snapToken
  // yang belum kedaluwarsa, pakai lagi tokennya — jangan buat transaksi baru terus.
  if (order.payment?.snapToken) {
    return NextResponse.json({ snapToken: order.payment.snapToken });
  }

  // ID transaksi ke Midtrans harus unik. Tempel timestamp biar aman kalau
  // order pernah dibuatkan transaksi lalu gagal.
  const midtransOrderId = `${order.orderNumber}-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: order.total,
    },
    customer_details: {
      first_name: order.customerName || `Meja ${order.table.label}`,
    },
    item_details: [
      ...order.items.map((item) => ({
        id: item.menuItemId,
        name: item.nameSnapshot.slice(0, 50),
        price: item.priceSnapshot,
        quantity: item.quantity,
      })),
      {
        id: "service-fee",
        name: "Biaya layanan",
        price: order.serviceFee,
        quantity: 1,
      },
    ],
    // Aktifkan metode yang paling relevan untuk dine-in cepat: QRIS, e-wallet, VA, kartu.
    enabled_payments: [
      "qris",
      "gopay",
      "shopeepay",
      "other_qris",
      "bca_va",
      "bni_va",
      "bri_va",
      "permata_va",
      "credit_card",
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/table/${order.table.code}/checkout?order=${order.id}`,
    },
  };

  const transaction = await snap.createTransaction(parameter);

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      midtransOrderId,
      snapToken: transaction.token,
      grossAmount: order.total,
      status: "pending",
    },
    update: {
      midtransOrderId,
      snapToken: transaction.token,
      status: "pending",
    },
  });

  return NextResponse.json({ snapToken: transaction.token });
}
