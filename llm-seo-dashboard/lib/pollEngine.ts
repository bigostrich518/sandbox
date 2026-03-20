import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock" });

export interface PollResult {
  count: number;
  errors: string[];
}

/**
 * Core polling logic: queries all prompts for a campaign, sends each to Gemini
 * with Google Search grounding, and stores the responses with sentiment scores.
 *
 * Used by both the manual "Run Polling Engine" button and the Vercel Cron endpoint.
 */
export async function pollCampaign(
  campaignId: number,
  options: { mockMode?: boolean } = {}
): Promise<PollResult> {
  const { mockMode = false } = options;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const prompts = await prisma.prompt.findMany({
    where: { campaignId: campaign.id },
  });

  if (!prompts.length) {
    return { count: 0, errors: ["No prompts configured"] };
  }

  const savedResponses: any[] = [];
  const errors: string[] = [];

  for (const prompt of prompts) {
    if (mockMode) {
      const mockRow1 = await prisma.lLMResponse.create({
        data: {
          promptId: prompt.id,
          modelName: "gpt-4o-mini",
          responseText: `[MOCK OpenAI] Based on the site, here is my response to: ${prompt.text}`,
          sentimentScore: 8.5,
          reasoning: "The model found strong alignment with campaign goals on the homepage.",
          isMock: true,
        },
      });
      const mockRow2 = await prisma.lLMResponse.create({
        data: {
          promptId: prompt.id,
          modelName: "claude-3-5-haiku",
          responseText: `[MOCK Anthropic] The website seems to indicate: ${prompt.text}`,
          sentimentScore: 6.2,
          reasoning: "Alignment is moderate; some secondary pages lack clear branding.",
          isMock: true,
        },
      });
      const mockRow3 = await prisma.lLMResponse.create({
        data: {
          promptId: prompt.id,
          modelName: "gemini-flash",
          responseText: `[MOCK Google] As an AI, evaluating your query: ${prompt.text}`,
          sentimentScore: 9.1,
          reasoning: "Excellent presence in primary search results for this domain.",
          isMock: true,
        },
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
        tools: [{ googleSearch: {} }],
      };

      // Gemini 2.5 Flash
      try {
        const resGemini25 = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt.text,
          config: genConfig,
        });

        let rawText = resGemini25.text || "{}";
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) rawText = jsonMatch[0];

        let aiData: any = {
          responseText: resGemini25.text || "No response",
          sentimentScore: 5,
          reasoning: "",
        };
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.responseText) aiData = parsed;
        } catch (e) {}

        savedResponses.push(
          await prisma.lLMResponse.create({
            data: {
              promptId: prompt.id,
              modelName: "gemini-2.5-flash",
              responseText: aiData.responseText,
              sentimentScore: aiData.sentimentScore,
              reasoning: aiData.reasoning,
              isMock: false,
            },
          })
        );
      } catch (e: any) {
        console.error("Gemini 2.5 Flash Error:", e.message);
        errors.push(`gemini-2.5-flash: ${e.message}`);
      }
    }
  }

  // Update lastPolledAt on the campaign
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { lastPolledAt: new Date() },
  });

  return { count: savedResponses.length, errors };
}
