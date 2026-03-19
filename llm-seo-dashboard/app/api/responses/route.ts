import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    const responses = await prisma.lLMResponse.findMany({
      where: campaignId ? {
        prompt: {
          campaignId: parseInt(campaignId)
        }
      } : {},
      orderBy: { createdAt: "desc" },
      include: {
        prompt: true,
      },
    });
    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const result = await prisma.lLMResponse.deleteMany({
      where: {
        prompt: {
          campaignId: parseInt(campaignId),
        },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error deleting responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
