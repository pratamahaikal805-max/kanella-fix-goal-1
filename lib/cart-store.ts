import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

type CartState = {
  tableId: string | null;
  lines: CartLine[];
  setTable: (tableId: string) => void;
  addItem: (item: Omit<CartLine, "quantity">) => void;
  removeLine: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tableId: null,
      lines: [],
      setTable: (tableId) => {
        // Kalau customer pindah meja (QR beda), keranjang lama dikosongkan
        // biar order gak nyasar ke meja yang salah.
        if (get().tableId && get().tableId !== tableId) {
          set({ tableId, lines: [] });
        } else {
          set({ tableId });
        }
      },
      addItem: (item) => {
        const lines = get().lines;
        const existing = lines.find((l) => l.menuItemId === item.menuItemId);
        if (existing) {
          set({
            lines: lines.map((l) =>
              l.menuItemId === item.menuItemId
                ? { ...l, quantity: l.quantity + 1 }
                : l
            ),
          });
        } else {
          set({ lines: [...lines, { ...item, quantity: 1 }] });
        }
      },
      removeLine: (menuItemId) =>
        set({ lines: get().lines.filter((l) => l.menuItemId !== menuItemId) }),
      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeLine(menuItemId);
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.menuItemId === menuItemId ? { ...l, quantity } : l
          ),
        });
      },
      clear: () => set({ lines: [] }),
    }),
    { name: "kedai-cart" }
  )
);
