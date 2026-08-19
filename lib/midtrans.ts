import midtransClient from "midtrans-client";

// PENTING: file ini hanya boleh dipakai di server (API routes),
// karena pakai MIDTRANS_SERVER_KEY yang bersifat rahasia.
// Jangan pernah import lib ini di komponen client ("use client").

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});

// Verifikasi keaslian notifikasi webhook Midtrans dengan cara re-check status
// ke server Midtrans (BUKAN cuma percaya payload yang masuk).
// Ini mencegah orang mengirim webhook palsu untuk "meloloskan" pembayaran.
export async function verifyTransactionStatus(orderId: string) {
  return coreApi.transaction.status(orderId);
}
