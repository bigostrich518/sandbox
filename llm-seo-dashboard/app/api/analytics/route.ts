import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const range = searchParams.get("range") || "30d";

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    // Calculate date filter
    let dateFilter: Date | undefined;
    if (range === "7d") {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    // "all" = no date filter

    // Fetch all responses for this campaign's prompts
    const responses = await prisma.lLMResponse.findMany({
      where: {
        prompt: {
          campaignId: parseInt(campaignId),
        },
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
      include: {
        prompt: { select: { text: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (responses.length === 0) {
      return NextResponse.json({
        timeSeries: [],
        modelAverages: [],
        models: [],
        summary: {
          totalResponses: 0,
          avgSentiment: 0,
          bestModel: null,
          worstModel: null,
          latestPoll: null,
        },
      });
    }

    // Build time series: group by date + model → average sentiment
    const dateModelMap = new Map<string, Map<string, { total: number; count: number }>>();
    const modelTotals = new Map<string, { total: number; count: number }>();
    const allModels = new Set<string>();

    for (const r of responses) {
      const dateKey = new Date(r.createdAt).toISOString().split("T")[0];
      const score = r.sentimentScore ?? 0;

      allModels.add(r.modelName);

      // Time series aggregation
      if (!dateModelMap.has(dateKey)) {
        dateModelMap.set(dateKey, new Map());
      }
      const dayMap = dateModelMap.get(dateKey)!;
      if (!dayMap.has(r.modelName)) {
        dayMap.set(r.modelName, { total: 0, count: 0 });
      }
      const entry = dayMap.get(r.modelName)!;
      entry.total += score;
      entry.count += 1;

      // Model totals
      if (!modelTotals.has(r.modelName)) {
        modelTotals.set(r.modelName, { total: 0, count: 0 });
      }
      const mEntry = modelTotals.get(r.modelName)!;
      mEntry.total += score;
      mEntry.count += 1;
    }

    // Build time series array
    const timeSeries = Array.from(dateModelMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, models]) => {
        const point: Record<string, any> = { date };
        for (const [model, { total, count }] of models.entries()) {
          point[model] = Math.round((total / count) * 10) / 10;
        }
        return point;
      });

    // Build model averages
    const modelAverages = Array.from(modelTotals.entries())
      .map(([model, { total, count }]) => ({
        model,
        avgScore: Math.round((total / count) * 10) / 10,
        responseCount: count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Summary stats
    const overallTotal = responses.reduce((sum, r) => sum + (r.sentimentScore ?? 0), 0);
    const avgSentiment = Math.round((overallTotal / responses.length) * 10) / 10;

    return NextResponse.json({
      timeSeries,
      modelAverages,
      models: Array.from(allModels),
      summary: {
        totalResponses: responses.length,
        avgSentiment,
        bestModel: modelAverages[0]?.model || null,
        worstModel: modelAverages[modelAverages.length - 1]?.model || null,
        latestPoll: responses[responses.length - 1]?.createdAt || null,
      },
    });
  } catch (error: any) {
    console.error("Analytics error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
