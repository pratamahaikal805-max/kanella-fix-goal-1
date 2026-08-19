"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useCartStore } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";

type OrderStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "DIBAYAR"
  | "DIPROSES"
  | "SIAP_DIANTAR"
  | "SELESAI"
  | "DIBATALKAN";

export default function CheckoutPage({ params }: { params: { tableId: string } }) {
  const tableCode = params.tableId.toUpperCase();
  const { lines, clear } = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  // Poll status order tiap 3 detik setelah popup pembayaran dibuka,
  // supaya UI otomatis update begitu webhook Midtrans masuk.
  useEffect(() => {
    if (!orderId || status === "DIBAYAR" || status === "DIBATALKAN") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const { order } = await res.json();
        setStatus(order.status);
        if (order.status === "DIBAYAR") clear();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId, status, clear]);

  async function handlePay() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableCode,
          customerName: customerName || undefined,
          notes: notes || undefined,
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
          })),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      setOrderId(orderData.order.id);
      setOrderNumber(orderData.order.orderNumber);
      setStatus(orderData.order.status);

      const paymentRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.order.id }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error);

      // @ts-ignore - window.snap disuntik oleh script Midtrans
      window.snap.pay(paymentData.snapToken, {
        onSuccess: () => setStatus("DIBAYAR"),
        onPending: () => setStatus("MENUNGGU_PEMBAYARAN"),
        onError: () => setErrorMsg("Pembayaran gagal. Coba lagi ya."),
        onClose: () => {
          // Customer nutup popup tanpa selesai bayar — biarkan status polling yang menentukan,
          // jangan langsung dianggap gagal karena bisa saja sudah settlement.
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "DIBAYAR" || status === "DIPROSES" || status === "SIAP_DIANTAR") {
    return (
      <main className="min-h-screen bg-espresso-900 text-crema-100 flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-mono text-amber-500 text-sm mb-3">Pembayaran diterima</p>
          <h1 className="font-display text-3xl font-semibold mb-2">
            Pesanan #{orderNumber} sedang disiapkan
          </h1>
          <p className="text-crema-200/70">
            Tunjukkan nomor ini ke staf kalau ada pertanyaan. Makanan akan diantar ke meja kamu.
          </p>
        </div>
      </main>
    );
  }

  if (lines.length === 0 && !orderId) {
    return (
      <main className="min-h-screen bg-crema-200 flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-xl text-espresso-900 mb-3">Keranjang kosong</p>
          <a href={`/table/${tableCode}`} className="text-amber-600 underline">
            Kembali ke menu
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-crema-200 px-6 pb-16">
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      <header className="pt-8 pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-600">
          Meja {tableCode}
        </p>
        <h1 className="font-display text-2xl font-semibold text-espresso-900 mt-1">
          Review pesanan
        </h1>
      </header>

      <div className="bg-white/60 rounded-xl p-5 mb-5">
        {lines.map((l) => (
          <div key={l.menuItemId} className="flex justify-between py-2 text-sm">
            <span className="text-espresso-900">
              {l.quantity}x {l.name}
            </span>
            <span className="font-mono text-espresso-900/70">
              {formatRupiah(l.price * l.quantity)}
            </span>
          </div>
        ))}
        <div className="border-t border-dashed border-espresso-900/20 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-espresso-900/60">
            <span>Subtotal</span>
            <span className="font-mono">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-espresso-900/60">
            <span>Biaya layanan</span>
            <span className="font-mono">{formatRupiah(serviceFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-espresso-900 pt-1">
            <span>Total</span>
            <span className="font-mono">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nama kamu (opsional)"
          className="w-full rounded-lg border border-espresso-900/15 px-4 py-3 bg-white/70 text-espresso-900 placeholder:text-espresso-900/40"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan untuk dapur (opsional), mis. tidak pedas"
          rows={2}
          className="w-full rounded-lg border border-espresso-900/15 px-4 py-3 bg-white/70 text-espresso-900 placeholder:text-espresso-900/40"
        />
      </div>

      {errorMsg && (
        <p className="text-stamp-500 text-sm mb-4 font-medium">{errorMsg}</p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 transition-colors text-espresso-950 font-semibold py-4 rounded-full"
      >
        {loading ? "Menyiapkan pembayaran…" : `Bayar ${formatRupiah(total)}`}
      </button>
      <p className="text-center text-xs text-espresso-900/40 mt-3 font-mono">
        Dibayar aman lewat Midtrans · QRIS, e-wallet, VA, kartu
      </p>
    </main>
  );
}
