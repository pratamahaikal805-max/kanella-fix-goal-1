"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";

export default function CartDrawer({ tableCode }: { tableCode: string }) {
  const [open, setOpen] = useState(false);
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const router = useRouter();

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-espresso-950/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 right-0 bottom-0 z-50 bg-crema-100 rounded-t-2xl ticket-edge shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-[calc(100%-88px)]"
        }`}
        style={{ maxHeight: "80vh" }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-6 py-5"
        >
          <div className="text-left">
            <p className="font-mono text-xs uppercase tracking-widest text-espresso-900/50">
              {itemCount} item
            </p>
            <p className="font-display font-semibold text-lg text-espresso-900">
              {formatRupiah(subtotal)}
            </p>
          </div>
          <span className="font-semibold text-amber-600 underline underline-offset-4">
            {open ? "Tutup" : "Lihat keranjang"}
          </span>
        </button>

        <div className="px-6 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {lines.map((line) => (
            <div
              key={line.menuItemId}
              className="flex items-center justify-between py-3 border-t border-dashed border-espresso-900/15"
            >
              <div>
                <p className="font-medium text-espresso-900">{line.name}</p>
                <p className="font-mono text-xs text-espresso-900/50">
                  {formatRupiah(line.price)} x {line.quantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label={`Kurangi ${line.name}`}
                  onClick={() => updateQuantity(line.menuItemId, line.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-espresso-900/30 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-4 text-center font-mono">{line.quantity}</span>
                <button
                  aria-label={`Tambah ${line.name}`}
                  onClick={() => updateQuantity(line.menuItemId, line.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-espresso-900/30 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <button
            onClick={() => router.push(`/table/${tableCode}/checkout`)}
            className="w-full bg-amber-500 hover:bg-amber-600 transition-colors text-espresso-950 font-semibold py-4 rounded-full"
          >
            Checkout · {formatRupiah(subtotal)}
          </button>
        </div>
      </div>
    </>
  );
}
