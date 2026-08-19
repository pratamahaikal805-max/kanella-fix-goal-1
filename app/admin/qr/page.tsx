"use client";

import { useEffect, useState } from "react";

type TableQr = { id: string; code: string; label: string; url: string; qrDataUrl: string };

export default function QrPage() {
  const [tables, setTables] = useState<TableQr[]>([]);

  useEffect(() => {
    fetch("/api/admin/tables-qr")
      .then((r) => r.json())
      .then((d) => setTables(d.tables));
  }, []);

  return (
    <main className="min-h-screen bg-crema-200 px-6 py-8 print:bg-white">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="font-display text-2xl font-semibold text-espresso-900">
          QR Code per meja
        </h1>
        <button
          onClick={() => window.print()}
          className="bg-espresso-900 text-crema-100 px-5 py-2 rounded-full text-sm"
        >
          Cetak semua
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
        {tables.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl p-6 text-center border border-espresso-900/10 break-inside-avoid"
          >
            <img src={t.qrDataUrl} alt={`QR ${t.label}`} className="mx-auto mb-3 w-40 h-40" />
            <p className="font-display font-semibold text-espresso-900">{t.label}</p>
            <p className="font-mono text-xs text-espresso-900/50">{t.url}</p>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <p className="text-espresso-900/40 font-mono text-sm text-center pt-16">
          Memuat QR meja…
        </p>
      )}
    </main>
  );
}
