import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Prompt text is required" }, { status: 400 });
    }

    const prompt = await prisma.prompt.create({
      data: { text },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
