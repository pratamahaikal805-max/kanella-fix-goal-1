import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/format";

type IncomingLine = { menuItemId: string; quantity: number; notes?: string };

export async function POST(req: Request) {
  const body = await req.json();
  const { tableCode, customerName, notes, lines } = body as {
    tableCode: string;
    customerName?: string;
    notes?: string;
    lines: IncomingLine[];
  };

  if (!tableCode || !lines?.length) {
    return NextResponse.json(
      { error: "Meja dan minimal 1 item wajib diisi." },
      { status: 400 }
    );
  }

  const table = await prisma.table.findUnique({ where: { code: tableCode } });
  if (!table || !table.isActive) {
    return NextResponse.json({ error: "Meja tidak valid." }, { status: 404 });
  }

  // Ambil harga & ketersediaan asli dari database — JANGAN pernah percaya
  // harga yang dikirim dari browser, itu bisa dimanipulasi.
  const menuItemIds = lines.map((l) => l.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  });

  const unavailable = menuItems.filter((m) => !m.isAvailable);
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: `Menu berikut sedang habis: ${unavailable.map((m) => m.name).join(", ")}` },
      { status: 400 }
    );
  }
  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json(
      { error: "Ada item yang tidak ditemukan di menu. Refresh halaman dan coba lagi." },
      { status: 400 }
    );
  }

  let subtotal = 0;
  const orderItemsData = lines.map((line) => {
    const menuItem = menuItems.find((m) => m.id === line.menuItemId)!;
    const lineTotal = menuItem.price * line.quantity;
    subtotal += lineTotal;
    return {
      menuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      priceSnapshot: menuItem.price,
      quantity: line.quantity,
      notes: line.notes,
    };
  });

  const serviceFee = Math.round(subtotal * 0.05); // biaya layanan 5%, sesuaikan kebijakan kedai
  const total = subtotal + serviceFee;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      tableId: table.id,
      customerName,
      notes,
      subtotal,
      serviceFee,
      total,
      items: { create: orderItemsData },
    },
    include: { items: true, table: true },
  });

  return NextResponse.json({ order });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : { status: { not: "MENUNGGU_PEMBAYARAN" } },
    include: { items: true, table: true, payment: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}
