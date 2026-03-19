import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    const prompts = await prisma.prompt.findMany({
      where: campaignId ? { campaignId: parseInt(campaignId) } : {},
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text, campaignId } = await request.json();
    if (!text || !campaignId) {
      return NextResponse.json({ error: "Prompt text and Campaign ID are required" }, { status: 400 });
    }

    const prompt = await prisma.prompt.create({
      data: { 
        text,
        campaignId: parseInt(campaignId)
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
