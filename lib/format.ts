export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Nomor tiket pendek yang gampang disebut & dicari staf, mis. "K-482"
export function generateOrderNumber(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `K-${n}${Date.now().toString().slice(-1)}`;
}
