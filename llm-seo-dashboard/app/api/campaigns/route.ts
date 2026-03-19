import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(campaigns);
    } catch (error: any) {
        console.error("GET Campaigns Error:", error);
        const keys = prisma ? Object.keys(prisma) : ["prisma-is-null"];
        let prismaDir = "unknown";
        try {
            // @ts-ignore
            prismaDir = require('path').dirname(require.resolve('@prisma/client'));
        } catch (e) {}
        return NextResponse.json({ 
            error: "Internal Server Error", 
            detail: error.message,
            availableModels: keys.filter(k => !k.startsWith("_") && !k.startsWith("$")),
            prismaDir
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, url } = await request.json();
        if (!name || !url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const campaign = await prisma.campaign.create({
            data: { name, url },
        });
        return NextResponse.json(campaign);
    } catch (error: any) {
        console.error("POST Campaigns Error:", error);
        return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
    }
}