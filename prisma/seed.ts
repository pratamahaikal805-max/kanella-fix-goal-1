import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Bersihkan data lama biar seed idempotent
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();

  // Meja - sesuaikan jumlah & nama dengan layout kedai aslinya
  await prisma.table.createMany({
    data: [
      { code: "A1", label: "Meja A1" },
      { code: "A2", label: "Meja A2" },
      { code: "A3", label: "Meja A3" },
      { code: "B1", label: "Meja B1 - Outdoor" },
      { code: "B2", label: "Meja B2 - Outdoor" },
      { code: "BAR", label: "Bar Seat" },
    ],
  });

  const kopi = await prisma.category.create({
    data: { name: "Kopi", sortOrder: 1 },
  });
  const nonKopi = await prisma.category.create({
    data: { name: "Non-Kopi", sortOrder: 2 },
  });
  const snack = await prisma.category.create({
    data: { name: "Snack", sortOrder: 3 },
  });
  const pastry = await prisma.category.create({
    data: { name: "Pastry", sortOrder: 4 },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: kopi.id,
        name: "Espresso",
        description: "Single shot espresso, biji house blend.",
        price: 20000,
      },
      {
        categoryId: kopi.id,
        name: "Kopi Susu Gula Aren",
        description: "Espresso, susu segar, gula aren asli.",
        price: 25000,
        isSignature: true,
      },
      {
        categoryId: kopi.id,
        name: "Cappuccino",
        description: "Espresso, steamed milk, foam tebal.",
        price: 27000,
      },
      {
        categoryId: kopi.id,
        name: "Americano",
        description: "Espresso dengan air panas atau dingin.",
        price: 22000,
      },
      {
        categoryId: nonKopi.id,
        name: "Matcha Latte",
        description: "Matcha grade ceremonial, susu segar.",
        price: 28000,
      },
      {
        categoryId: nonKopi.id,
        name: "Chocolate Latte",
        description: "Dark chocolate premium, creamy.",
        price: 26000,
      },
      {
        categoryId: nonKopi.id,
        name: "Lemon Tea",
        description: "Teh hitam, perasan lemon segar.",
        price: 18000,
      },
      {
        categoryId: snack.id,
        name: "French Fries",
        description: "Kentang goreng renyah, saus sambal & mayo.",
        price: 20000,
      },
      {
        categoryId: snack.id,
        name: "Chicken Wings (5pcs)",
        description: "Sayap ayam crispy, bumbu pedas manis.",
        price: 32000,
      },
      {
        categoryId: pastry.id,
        name: "Croissant Butter",
        description: "Croissant butter panggang fresh setiap pagi.",
        price: 24000,
      },
      {
        categoryId: pastry.id,
        name: "Banana Cake",
        description: "Cake pisang lembut, taburan kenari.",
        price: 22000,
      },
    ],
  });

  console.log("Seed selesai: meja & menu cafe sudah masuk ke database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
