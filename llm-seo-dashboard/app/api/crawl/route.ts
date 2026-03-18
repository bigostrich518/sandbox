import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

export async function POST() {
  try {
    const domain = await prisma.targetDomain.findFirst();

    if (!domain || !domain.url) {
      return NextResponse.json({ error: "No target domain configured" }, { status: 400 });
    }

    const baseUrl = new URL(domain.url);
    const visited = new Set<string>();
    const queue = [domain.url];
    let totalText = "";
    let pagesCrawled = 0;
    const MAX_PAGES = 5;

    // Launch browser once for the crawl session
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; LLM-SEO-Bot/1.0)",
    });

    try {
      while (queue.length > 0 && pagesCrawled < MAX_PAGES) {
        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        
        visited.add(currentUrl);

        try {
          const page = await context.newPage();
          // Wait for network idle to ensure SPA renders
          await page.goto(currentUrl, { waitUntil: "networkidle", timeout: 15000 });
          
          const html = await page.content();
          const $ = cheerio.load(html);

          // Find internal links to add to queue BEFORE removing elements
          $("a[href]").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            
            try {
              const absoluteUrl = new URL(href, currentUrl);
              // Only follow links on the same domain that we haven't visited
              if (absoluteUrl.hostname === baseUrl.hostname && !visited.has(absoluteUrl.href)) {
                // Ignore fragments and query params for simplicity of unique pages
                absoluteUrl.hash = "";
                absoluteUrl.search = "";
                // Remove trailing slash for normalization (except for root)
                const normalizedHref = absoluteUrl.href.endsWith('/') && absoluteUrl.pathname !== '/' 
                  ? absoluteUrl.href.slice(0, -1) 
                  : absoluteUrl.href;

                if (!queue.includes(normalizedHref) && !visited.has(normalizedHref)) {
                   queue.push(normalizedHref);
                }
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          });

          // Remove unwanted elements
          $("nav, header, footer, script, style, aside, iframe, noscript").remove();

          // Extract text from main or body
          const mainContent = $("main").length ? $("main").text() : $("body").text();
          const cleanedText = mainContent.replace(/\s+/g, " ").trim();
          
          if (cleanedText) {
            totalText += `\n\n--- Page: ${currentUrl} ---\n\n` + cleanedText;
          }
          pagesCrawled++;


          await page.close();

        } catch (err: any) {
          console.warn(`Failed to crawl ${currentUrl}:`, err.message);
        }
      }
    } finally {
      // Ensure browser resources are always cleaned up
      await context.close();
      await browser.close();
    }

    const finalScrapedContent = totalText.substring(0, 50000);

    const updatedDomain = await prisma.targetDomain.update({
      where: { id: domain.id },
      data: {
        scrapedContent: finalScrapedContent, // Cap at 50k chars
        pagesCrawled: pagesCrawled,
        lastCrawledAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      pagesCrawled: pagesCrawled, 
      domain: updatedDomain,
      crawlStats: {
        totalCharacters: finalScrapedContent.length,
        excerpt: finalScrapedContent.substring(0, 800) + (finalScrapedContent.length > 800 ? "..." : ""),
        crawledUrls: Array.from(visited)
      }
    });
  } catch (error: any) {
    console.error("Crawler Error:", error.message);
    return NextResponse.json({ error: "Failed to crawl domain" }, { status: 500 });
  }
}
