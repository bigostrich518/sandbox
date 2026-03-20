import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pollCampaign } from "@/lib/pollEngine";

/**
 * Vercel Cron endpoint — GET /api/cron/poll
 *
 * Secured with CRON_SECRET. Loops through all campaigns that have prompts
 * and polls each one. Designed to be triggered daily by Vercel Cron.
 *
 * Can also be called manually for testing:
 *   curl http://localhost:3000/api/cron/poll -H "Authorization: Bearer YOUR_SECRET"
 */
export async function GET(request: Request) {
  // Auth check — verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all campaigns that have at least one prompt
    const campaigns = await prisma.campaign.findMany({
      where: {
        prompts: {
          some: {},
        },
      },
      select: { id: true, name: true },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No campaigns with prompts found",
        results: [],
      });
    }

    const results = [];

    for (const campaign of campaigns) {
      try {
        const result = await pollCampaign(campaign.id);
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          ...result,
        });

        // Stagger between campaigns to avoid rate limits
        if (campaigns.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (e: any) {
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          count: 0,
          errors: [e.message],
        });
      }
    }

    const totalCount = results.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      success: true,
      totalResponses: totalCount,
      campaignsPolled: campaigns.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron poll error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
