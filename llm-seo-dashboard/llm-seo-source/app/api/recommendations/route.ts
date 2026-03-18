import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recommendations = await prisma.recommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 1
    });
    return NextResponse.json(recommendations[0] || null);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
