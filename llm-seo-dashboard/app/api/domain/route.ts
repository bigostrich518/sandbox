import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const campaign = await prisma.campaign.findFirst({
      include: {
        objectives: true,
      },
    });
    return NextResponse.json(campaign || null);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, objectives } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let campaign = await prisma.campaign.findFirst();

    if (campaign) {
      campaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { name: name || campaign.name, url },
      });
    } else {
      campaign = await prisma.campaign.create({
        data: { name: name || "My Campaign", url },
      });
    }

    if (objectives && Array.isArray(objectives)) {
      // Clear existing
      await prisma.campaignObjective.deleteMany({
        where: { campaignId: campaign.id },
      });

      // Create new
      await prisma.campaignObjective.createMany({
        data: objectives.map((text: string) => ({
          text,
          campaignId: campaign!.id,
        })),
      });
    }

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { objectives: true },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error saving campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
