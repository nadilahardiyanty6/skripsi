import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, description, priceCents, stock, imageUrl } = body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        description,
        priceCents: parseInt(priceCents),
        stock: parseInt(stock),
        imageUrl,
        isActive: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal simpan", error }, { status: 500 });
  }
}