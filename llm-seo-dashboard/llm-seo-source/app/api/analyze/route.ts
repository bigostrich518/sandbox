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
      You are an LLM SEO analyst.
      1. Website content: ${domain?.scrapedContent ? domain.scrapedContent.substring(0, 10000) : "No content"}
      2. Campaign objectives: ${objectivesCtx}
      3. Recent AI responses to tracked prompts: ${responsesCtx}

      Task:
      - Score the sentiment/alignment of each AI's response (0-10, where 10 = perfectly aligned with objectives)
      - Generate specific content recommendations to add to the website to improve these scores next time.
      - Return ONLY a valid JSON object starting with '{'. Format: { "scores": [{ "promptText": string, "modelName": string, "score": number }], "recommendations": [string, string...] }
    `;

    // Recommendation engine never uses Search Grounding — model is user-selected
    const resGemini = await ai.models.generateContent({
      model: modelToUse,
      contents: promptText,
      config: {
        systemInstruction: `You are an LLM SEO analyst. Today's date is ${new Date().toLocaleDateString()}.`,
        temperature: 0.7,
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
