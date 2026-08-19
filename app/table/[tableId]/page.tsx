"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import MenuCard from "@/components/MenuCard";
import CartDrawer from "@/components/CartDrawer";

type MenuItemT = {
  id: string;
  name: string;
  description: string;
  price: number;
  isSignature: boolean;
};
type CategoryT = { id: string; name: string; items: MenuItemT[] };
type TableT = { id: string; code: string; label: string };

export default function TableMenuPage({ params }: { params: { tableId: string } }) {
  const tableCode = params.tableId.toUpperCase();
  const [table, setTable] = useState<TableT | null>(null);
  const [categories, setCategories] = useState<CategoryT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const setTableInCart = useCartStore((s) => s.setTable);

  useEffect(() => {
    async function load() {
      const tableRes = await fetch(`/api/table/${tableCode}`);
      if (!tableRes.ok) {
        const data = await tableRes.json();
        setError(data.error);
        return;
      }
      const { table } = await tableRes.json();
      setTable(table);
      setTableInCart(table.id);

      const menuRes = await fetch("/api/menu");
      const { categories } = await menuRes.json();
      setCategories(categories);
      if (categories[0]) setActiveCategory(categories[0].id);
    }
    load();
  }, [tableCode, setTableInCart]);

  if (error) {
    return (
      <main className="min-h-screen bg-espresso-900 text-crema-100 flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-mono text-amber-500 text-sm mb-3">Ups</p>
          <p className="font-display text-xl">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-crema-200 pb-32">
      {/* Header ala tiket - nomor meja ditampilkan seperti stub klaim */}
      <header className="bg-espresso-900 text-crema-100 px-6 pt-8 pb-10 rounded-b-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-500">
          Kedai Order
        </p>
        <div className="flex items-end justify-between mt-3">
          <h1 className="font-display text-3xl font-semibold">
            {table ? table.label : "Memuat…"}
          </h1>
          {table && (
            <span className="font-mono text-xs border border-crema-100/40 rounded px-2 py-1">
              #{table.code}
            </span>
          )}
        </div>
        <p className="text-crema-200/70 text-sm mt-2">
          Pilih menu, checkout, bayar langsung dari HP kamu.
        </p>
      </header>

      {/* Nav kategori sticky */}
      {categories.length > 0 && (
        <nav className="sticky top-0 z-30 bg-crema-200/95 backdrop-blur border-b border-espresso-900/10 px-6 py-3 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-full transition-colors ${
                activeCategory === cat.id
                  ? "bg-espresso-900 text-crema-100"
                  : "bg-transparent text-espresso-900/60 border border-espresso-900/15"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </nav>
      )}

      <div className="px-6">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="pt-6">
            <h2 className="font-display text-lg font-semibold text-espresso-900 mb-1">
              {cat.name}
            </h2>
            <div>
              {cat.items.map((item) => (
                <MenuCard key={item.id} {...item} />
              ))}
            </div>
          </section>
        ))}

        {categories.length === 0 && !error && (
          <p className="text-center text-espresso-900/50 pt-16 font-mono text-sm">
            Memuat menu…
          </p>
        )}
      </div>

      {table && <CartDrawer tableCode={table.code} />}
    </main>
  );
}
