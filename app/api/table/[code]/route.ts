import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const table = await prisma.table.findUnique({
    where: { code: params.code.toUpperCase() },
  });

  if (!table || !table.isActive) {
    return NextResponse.json(
      { error: "Meja tidak ditemukan. Coba scan ulang QR di meja Anda." },
      { status: 404 }
    );
  }

  return NextResponse.json({ table });
}
