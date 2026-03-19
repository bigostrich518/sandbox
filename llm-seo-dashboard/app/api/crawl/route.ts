import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { campaignId } = body;

    console.log(`Starting crawl for campaignId: ${campaignId}`);
    
    if (!campaignId) {
      return NextResponse.json({ error: "No campaignId provided" }, { status: 400 });
    }

    const domain = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) }
    });

    if (!domain || !domain.url) {
      console.error("Crawl error: No target domain found for ID", campaignId);
      return NextResponse.json({ error: "No target domain configured" }, { status: 400 });
    }

    console.log(`Crawling URL: ${domain.url}`);

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
          console.log(`Navigating to: ${currentUrl}`);
          const page = await context.newPage();
          // Wait for network idle AND a small delay to ensure any dynamic content/links load
          await page.goto(currentUrl, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(1000); 

          console.log(`Crawl success: ${currentUrl}`);
          
          // Use the browser's DOM to find links - much more reliable for SPAs
          const links = await page.$$eval('a[href]', (as) => as.map(a => (a as HTMLAnchorElement).href));
          console.log(`Discovered ${links.length} links on ${currentUrl}`);
          
          const baseHostname = baseUrl.hostname.replace(/^www\./, '');

          links.forEach((href) => {
            try {
              const absoluteUrl = new URL(href, currentUrl);
              const currentHostname = absoluteUrl.hostname.replace(/^www\./, '');

              // Only follow links on the same domain that we haven't visited
              if (currentHostname === baseHostname && !visited.has(absoluteUrl.href)) {
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

          // Get the HTML content AFTER link extraction
          const html = await page.content();
          const $ = cheerio.load(html);

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

    const updatedDomain = await prisma.campaign.update({
      where: { id: domain.id },
      data: {
        scrapedContent: finalScrapedContent, // Cap at 50k chars
        pagesCrawled: pagesCrawled,
        lastCrawledAt: new Date(),
      },
    });

    console.log(`Crawl completed. Pages: ${pagesCrawled}, Content Length: ${finalScrapedContent.length}`);

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
