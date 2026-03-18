import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mockMode = body.mockMode ?? false;
    const modelToUse = body.model || "gemini-2.5-flash";
    const useGrounding = body.useGrounding ?? false;

    if (mockMode) {
      const mockRecs = JSON.stringify({
        scores: [
          { promptId: 1, modelName: "gpt-4o-mini", score: 8.5 },
          { promptId: 1, modelName: "claude-3-5-haiku", score: 6.0 },
          { promptId: 1, modelName: "gemini-flash", score: 9.0 }
        ],
        recommendations: [
          "[MOCK] Add more keywords related to your core objective.",
          "[MOCK] Ensure the pricing page is more clearly linked from the homepage.",
          "[MOCK] Clarify the primary value proposition in the hero section."
        ]
      });

      const rec = await prisma.recommendation.create({
        data: { content: mockRecs }
      });
      return NextResponse.json({ success: true, recommendation: rec });
    }

    const domain = await prisma.targetDomain.findFirst({ include: { objectives: true } });
    const responses = await prisma.lLMResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 30, // Last 30 responses max as context
      include: { prompt: true }
    });

    const objectivesCtx = domain?.objectives.map((o) => o.text).join("; ") || "None provided";

    // Group responses context safely
    const responsesCtx = responses.map((r) =>
      `Prompt: ${r.prompt.text} | Model: ${r.modelName} | Response: ${r.responseText}`
    ).join("\n\n");

    const promptText = `
You are an expert LLM SEO Analyst. Your goal is to analyze how well various AI models are currently representing a target brand/website, and provide actionable recommendations to improve the website's content so future AI responses align better with the campaign objectives.

<objectives>
${objectivesCtx}
</objectives>

<website_content>
${domain?.scrapedContent ? domain.scrapedContent.substring(0, 10000) : "No content"}
</website_content>

<recent_ai_responses>
${responsesCtx}
</recent_ai_responses>

Task:
1. For each AI response, evaluate its alignment with the campaign objectives on a scale of 0 to 10 (10 = perfectly aligned/positive, 0 = completely misaligned/negative).
2. Generate 3-5 specific, actionable content changes the website owner should make to their site to improve these AI responses in the future.

Output exactly as JSON using this schema:
{
  "scores": [
    { 
      "promptText": "The prompt evaluated", 
      "modelName": "The model that responded", 
      "reasoning": "A brief 1-sentence explanation of why you gave this score",
      "score": 8
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
`;

    const resGemini = await ai.models.generateContent({
      model: modelToUse,
      contents: promptText,
      config: {
        systemInstruction: `You are an expert LLM SEO analyst. Today's date is ${new Date().toLocaleDateString()}.`,
        temperature: 0.2, // Lower temperature makes grading more consistent
        responseMimeType: "application/json", // Force the Gemini API to return clean JSON
        ...(useGrounding ? { tools: [{ googleSearch: {} }] } : {}),
      }
    });

    // Extract JSON safely
    let aiText = resGemini.text || "{}";
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    const rec = await prisma.recommendation.create({
      data: { content: aiText }
    });

    return NextResponse.json({ success: true, recommendation: rec });

  } catch (error: any) {
    console.error("Error analyzing:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
