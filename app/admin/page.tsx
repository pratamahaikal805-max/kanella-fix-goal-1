"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";

type OrderT = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customerName: string | null;
  notes: string | null;
  table: { label: string; code: string };
  items: { nameSnapshot: string; quantity: number; notes: string | null }[];
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  DIBAYAR: "Baru dibayar",
  DIPROSES: "Diproses",
  SIAP_DIANTAR: "Siap diantar",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const NEXT_STATUS: Record<string, string | null> = {
  DIBAYAR: "DIPROSES",
  DIPROSES: "SIAP_DIANTAR",
  SIAP_DIANTAR: "SELESAI",
  SELESAI: null,
  DIBATALKAN: null,
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderT[]>([]);
  const [filter, setFilter] = useState<string>("aktif");

  async function load() {
    const res = await fetch("/api/orders");
    const { orders } = await res.json();
    setOrders(orders);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // polling — cukup untuk skala kedai, ganti ke websocket kalau order sangat ramai
    return () => clearInterval(interval);
  }, []);

  async function advanceStatus(order: OrderT) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  const visibleOrders = orders.filter((o) =>
    filter === "aktif" ? !["SELESAI", "DIBATALKAN"].includes(o.status) : true
  );

  return (
    <main className="min-h-screen bg-crema-200 px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-amber-600">
            Kedai Order
          </p>
          <h1 className="font-display text-2xl font-semibold text-espresso-900">
            Pesanan masuk
          </h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/qr"
            className="text-sm border border-espresso-900/20 px-4 py-2 rounded-full text-espresso-900"
          >
            QR Meja
          </a>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-espresso-900/20 rounded-full px-3"
          >
            <option value="aktif">Aktif</option>
            <option value="semua">Semua</option>
          </select>
        </div>
      </div>

      {visibleOrders.length === 0 && (
        <p className="text-espresso-900/40 font-mono text-sm text-center pt-16">
          Belum ada order.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-5 ticket-edge">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono font-semibold text-espresso-900">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-espresso-900/50">{order.table.label}</p>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${
                  order.status === "DIBAYAR"
                    ? "bg-amber-500/20 text-amber-600"
                    : order.status === "SIAP_DIANTAR"
                    ? "bg-green-500/20 text-green-700"
                    : "bg-espresso-900/10 text-espresso-900/60"
                }`}
              >
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>

            <ul className="text-sm text-espresso-900/80 my-3 space-y-1">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}x {item.nameSnapshot}
                  {item.notes && (
                    <span className="text-espresso-900/40"> — {item.notes}</span>
                  )}
                </li>
              ))}
            </ul>

            {order.notes && (
              <p className="text-xs bg-crema-200 rounded p-2 mb-3 text-espresso-900/70">
                Catatan: {order.notes}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-espresso-900">
                {formatRupiah(order.total)}
              </span>
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => advanceStatus(order)}
                  className="text-sm bg-espresso-900 text-crema-100 px-4 py-2 rounded-full hover:bg-amber-600 transition-colors"
                >
                  Tandai {STATUS_LABEL[NEXT_STATUS[order.status]!]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
