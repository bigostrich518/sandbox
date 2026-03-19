import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mockMode = body.mockMode ?? false;
    const { campaignId } = body;

    const domain = campaignId 
      ? await prisma.campaign.findUnique({ where: { id: parseInt(campaignId) } })
      : await prisma.campaign.findFirst();

    if (!domain) {
      return NextResponse.json({ error: "No campaign found" }, { status: 404 });
    }

    const prompts = await prisma.prompt.findMany({
      where: { campaignId: domain.id }
    });

    if (!prompts.length) {
      return NextResponse.json({ error: "No prompts configured" }, { status: 400 });
    }

    const savedResponses = [];

    for (const prompt of prompts) {
      if (mockMode) {
        // MOCK MODE — Generate deterministic fake responses
        const mockRow1 = await prisma.lLMResponse.create({
          data: {
            promptId: prompt.id,
            modelName: "gpt-4o-mini",
            responseText: `[MOCK OpenAI] Based on the site, here is my response to: ${prompt.text}`,
            sentimentScore: 8.5,
            reasoning: "The model found strong alignment with campaign goals on the homepage.",
            isMock: true,
          }
        });
        const mockRow2 = await prisma.lLMResponse.create({
          data: {
            promptId: prompt.id,
            modelName: "claude-3-5-haiku",
            responseText: `[MOCK Anthropic] The website seems to indicate: ${prompt.text}`,
            sentimentScore: 6.2,
            reasoning: "Alignment is moderate; some secondary pages lack clear branding.",
            isMock: true,
          }
        });
        const mockRow3 = await prisma.lLMResponse.create({
          data: {
            promptId: prompt.id,
            modelName: "gemini-flash",
            responseText: `[MOCK Google] As an AI, evaluating your query: ${prompt.text}`,
            sentimentScore: 9.1,
            reasoning: "Excellent presence in primary search results for this domain.",
            isMock: true,
          }
        });
        savedResponses.push(mockRow1, mockRow2, mockRow3);
      } else {
        // REAL API CALLS
        const systemInstruction = `You are a helpful assistant. Provide your response as a JSON object with the following schema:
{
  "responseText": "Your detailed answer to the prompt",
  "sentimentScore": 7.5,
  "reasoning": "A 1-2 sentence explanation of why you gave this score based on the brand's alignment with objectives."
}
Today's date is ${new Date().toLocaleDateString()}.`;

        const genConfig = {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        };

        // Gemini 2.5 Flash
        try {
          const resGemini25 = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt.text,
            config: genConfig
          });

          let aiData: any = { responseText: resGemini25.text || "No response", sentimentScore: 5, reasoning: "" };
          try {
             const parsed = JSON.parse(resGemini25.text || "{}");
             if (parsed.responseText) aiData = parsed;
          } catch (e) {}

          savedResponses.push(await prisma.lLMResponse.create({
            data: {
              promptId: prompt.id,
              modelName: "gemini-2.5-flash",
              responseText: aiData.responseText,
              sentimentScore: aiData.sentimentScore,
              reasoning: aiData.reasoning,
              isMock: false,
            }
          }));
        } catch (e: any) {
          console.error("Gemini 2.5 Flash Error:", e.message);
        }
      }
    }

    return NextResponse.json({ success: true, count: savedResponses.length });
    } catch (error: any) {
    console.error("Error polling models:", error.message);
    return NextResponse.json({ 
        error: "Internal Server Error", 
        detail: error.message,
        hint: "This may be due to a stale Prisma Client. Please restart the dev server."
    }, { status: 500 });
  }
}
