import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seeding products...");

  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Pink Blossom Dress",
        description: "Elegant soft pink dress for special occasions.",
        category: "Dress",
        imageUrl: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80",
        priceCents: 39900000,
        stock: 12,
      },
      {
        name: "Rose Satin Blouse",
        description: "Smooth satin blouse with feminine cut.",
        category: "Top",
        imageUrl: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1200&q=80",
        priceCents: 25900000,
        stock: 20,
      },
      {
        name: "Blush Pleated Skirt",
        description: "Flowy pleated skirt with premium fabric.",
        category: "Bottom",
        imageUrl: "https://images.unsplash.com/photo-1542060748-10c28b62716f?auto=format&fit=crop&w=1200&q=80",
        priceCents: 28900000,
        stock: 15,
      },
      {
        name: "Cherry Knit Cardigan",
        description: "Warm and stylish knit cardigan.",
        category: "Outerwear",
        imageUrl: "https://images.unsplash.com/photo-1618354691249-fbd1a8c90a8c?auto=format&fit=crop&w=1200&q=80",
        priceCents: 32900000,
        stock: 10,
      },
      {
        name: "Soft Pink Heels",
        description: "Comfortable heels for daily elegance.",
        category: "Shoes",
        imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
        priceCents: 45900000,
        stock: 8,
      },
      {
        name: "Blossom Mini Bag",
        description: "Minimalist mini bag with floral accent.",
        category: "Accessories",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
        priceCents: 19900000,
        stock: 25,
      },
      {
        name: "Pastel Pink Scarf",
        description: "Light scarf for everyday styling.",
        category: "Accessories",
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
        priceCents: 9900000,
        stock: 30,
      },
      {
        name: "Bloom Office Set",
        description: "Modern office outfit with feminine touch.",
        category: "Set",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
        priceCents: 54900000,
        stock: 6,
      },
    ],
  });

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
