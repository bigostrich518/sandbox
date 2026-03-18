import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const domain = await prisma.targetDomain.findFirst({
      include: {
        objectives: true,
      },
    });
    return NextResponse.json(domain || null);
  } catch (error) {
    console.error("Error fetching domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url, objectives } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let domain = await prisma.targetDomain.findFirst();

    if (domain) {
      domain = await prisma.targetDomain.update({
        where: { id: domain.id },
        data: { url },
      });
    } else {
      domain = await prisma.targetDomain.create({
        data: { url },
      });
    }

    if (objectives && Array.isArray(objectives)) {
      // Clear existing
      await prisma.campaignObjective.deleteMany({
        where: { domainId: domain.id },
      });

      // Create new
      await prisma.campaignObjective.createMany({
        data: objectives.map((text: string) => ({
          text,
          domainId: domain!.id,
        })),
      });
    }

    const updatedDomain = await prisma.targetDomain.findUnique({
      where: { id: domain.id },
      include: { objectives: true },
    });

    return NextResponse.json(updatedDomain);
  } catch (error) {
    console.error("Error saving domain:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
