"use client";

import { formatRupiah } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";

type Props = {
  id: string;
  name: string;
  description: string;
  price: number;
  isSignature: boolean;
};

export default function MenuCard({ id, name, description, price, isSignature }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const line = useCartStore((s) => s.lines.find((l) => l.menuItemId === id));

  return (
    <div className="flex gap-4 items-start py-4 border-b border-espresso-900/10">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-espresso-900">{name}</h3>
          {isSignature && (
            <span className="font-mono text-[10px] uppercase tracking-wider bg-stamp-500 text-crema-100 px-1.5 py-0.5 rounded-sm">
              Andalan
            </span>
          )}
        </div>
        <p className="text-sm text-espresso-900/60 mt-1 leading-snug">{description}</p>
        <p className="font-mono text-sm text-amber-600 mt-2">{formatRupiah(price)}</p>
      </div>
      <button
        onClick={() => addItem({ menuItemId: id, name, price })}
        aria-label={`Tambah ${name} ke keranjang`}
        className="shrink-0 w-9 h-9 rounded-full bg-espresso-900 text-crema-100 flex items-center justify-center text-lg hover:bg-amber-600 transition-colors active:scale-95"
      >
        {line ? line.quantity : "+"}
      </button>
    </div>
  );
}
