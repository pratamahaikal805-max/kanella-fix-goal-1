import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-espresso-900 text-crema-100 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
          Kedai Order
        </p>
        <h1 className="font-display text-4xl font-semibold mb-4">
          Website ini dibuka lewat QR di meja customer.
        </h1>
        <p className="text-crema-200/80 mb-8">
          Coba alur customer dengan link demo di bawah, atau buka panel dapur/admin
          untuk lihat pesanan masuk.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/table/A1"
            className="bg-amber-500 hover:bg-amber-600 transition-colors text-espresso-950 font-semibold py-3 rounded-full"
          >
            Coba sebagai customer (Meja A1)
          </Link>
          <Link
            href="/admin"
            className="border border-crema-100/30 hover:border-amber-500 transition-colors py-3 rounded-full"
          >
            Buka panel admin / dapur
          </Link>
          <Link
            href="/admin/qr"
            className="text-sm text-crema-200/60 underline underline-offset-4 mt-2"
          >
            Generate & cetak QR semua meja
          </Link>
        </div>
      </div>
    </main>
  );
}
