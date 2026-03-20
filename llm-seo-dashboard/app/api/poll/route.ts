import { NextResponse } from "next/server";
import { pollCampaign } from "@/lib/pollEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mockMode = body.mockMode ?? false;
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "No campaignId provided" }, { status: 400 });
    }

    const result = await pollCampaign(parseInt(campaignId), { mockMode });

    return NextResponse.json({
      success: result.count > 0,
      count: result.count,
      ...(result.errors.length > 0 && { errors: result.errors }),
    });
  } catch (error: any) {
    console.error("Error polling models:", error.message);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error.message,
        hint: "This may be due to a stale Prisma Client. Please restart the dev server.",
      },
      { status: 500 }
    );
  }
}
