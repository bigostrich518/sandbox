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

    const domain = await prisma.targetDomain.findFirst();
    const prompts = await prisma.prompt.findMany();

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
            isMock: true,
          }
        });
        const mockRow2 = await prisma.lLMResponse.create({
          data: {
            promptId: prompt.id,
            modelName: "claude-3-5-haiku",
            responseText: `[MOCK Anthropic] The website seems to indicate: ${prompt.text}`,
            isMock: true,
          }
        });
        const mockRow3 = await prisma.lLMResponse.create({
          data: {
            promptId: prompt.id,
            modelName: "gemini-flash",
            responseText: `[MOCK Google] As an AI, evaluating your query: ${prompt.text}`,
            isMock: true,
          }
        });
        savedResponses.push(mockRow1, mockRow2, mockRow3);
      } else {
        // REAL API CALLS
        const systemInstruction = `You are a helpful assistant. Today's date is ${new Date().toLocaleDateString()}. Please provide up-to-date information.`;
        const genConfig = {
          systemInstruction,
          temperature: 0.7,
          tools: [{ googleSearch: {} }]
        };

        // Gemini 2.5 Flash
        try {
          const resGemini25 = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt.text,
            config: genConfig
          });
          savedResponses.push(await prisma.lLMResponse.create({
            data: {
              promptId: prompt.id,
              modelName: "gemini-2.5-flash",
              responseText: resGemini25.text || "No response",
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
