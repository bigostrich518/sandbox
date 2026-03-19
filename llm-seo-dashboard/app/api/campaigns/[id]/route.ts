import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        objectives: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { name, url, objectives } = await request.json();

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { name, url },
    });

    if (objectives && Array.isArray(objectives)) {
      // Clear existing
      await prisma.campaignObjective.deleteMany({
        where: { campaignId: id },
      });

      // Create new
      await prisma.campaignObjective.createMany({
        data: objectives.map((text: string) => ({
          text,
          campaignId: id,
        })),
      });
    }

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: { objectives: true },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.campaign.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
