import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.table.findMany({ where: { isActive: true } });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const withQr = await Promise.all(
    tables.map(async (table) => {
      const url = `${baseUrl}/table/${table.code}`;
      const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400 });
      return { ...table, url, qrDataUrl };
    })
  );

  return NextResponse.json({ tables: withQr });
}
