import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const responses = await prisma.lLMResponse.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        prompt: true,
      },
    });
    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
