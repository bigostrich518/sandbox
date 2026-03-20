import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recommendationText, campaignId } = body;

    if (!recommendationText || !campaignId) {
      return NextResponse.json(
        { error: "recommendationText and campaignId are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
      include: { objectives: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const objectivesText =
      campaign.objectives.map((o) => o.text).join("\n- ") || "None provided";

    const websiteContext = campaign.scrapedContent
      ? campaign.scrapedContent.substring(0, 5000)
      : "No website content available";

    const promptText = `You are an expert content writer and SEO strategist. Your task is to write ready-to-use website content that implements a specific recommendation.

<campaign_objectives>
- ${objectivesText}
</campaign_objectives>

<current_website_context>
${websiteContext}
</current_website_context>

<recommendation>
${recommendationText}
</recommendation>

Write publication-ready content that directly implements this recommendation. The content should:
1. Align with the campaign objectives above
2. Be written in a professional, engaging tone
3. Be formatted with clear headings and structure where appropriate
4. Be ready to copy-paste into a website

Output ONLY the content itself — no meta-commentary, no preamble, no "here's the content" intro. Just the actual website content.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: promptText,
      config: {
        systemInstruction: `You are a professional content writer. Today's date is ${new Date().toLocaleDateString()}.`,
        temperature: 0.4,
      },
    });

    const content = result.text || "No content generated";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Content generation error:", error.message);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
