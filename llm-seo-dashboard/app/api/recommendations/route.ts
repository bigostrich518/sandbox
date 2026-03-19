import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    const recommendations = await prisma.recommendation.findMany({
      where: campaignId ? { campaignId: parseInt(campaignId) } : {},
      orderBy: { createdAt: "desc" },
      take: 1
    });
    return NextResponse.json(recommendations[0] || null);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
