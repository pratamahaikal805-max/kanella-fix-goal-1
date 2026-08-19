import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, table: true, payment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

const ALLOWED_STATUSES = [
  "DIPROSES",
  "SIAP_DIANTAR",
  "SELESAI",
  "DIBATALKAN",
];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  // Catatan: perubahan status di sini untuk operasional dapur (mis. DIPROSES -> SIAP_DIANTAR).
  // Status DIBAYAR/MENUNGGU_PEMBAYARAN hanya boleh diubah lewat webhook Midtrans,
  // supaya tidak ada order yang "ditandai lunas" tanpa pembayaran nyata.
  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ order });
}
