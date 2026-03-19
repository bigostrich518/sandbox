"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/components/CampaignContext";

export default function SettingsPage() {
  const { selectedCampaignId, refreshCampaigns } = useCampaign();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [message, setMessage] = useState("");
  const [crawlStats, setCrawlStats] = useState<{ totalCharacters: number, excerpt: string, pagesCrawled: number, crawledUrls?: string[] } | null>(null);

  useEffect(() => {
    if (!selectedCampaignId) return;
    fetch(`/api/campaigns/${selectedCampaignId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || "");
          setUrl(data.url || "");
          setObjectives(data.objectives?.map((o: any) => o.text).join("\n") || "");
        }
      });
  }, [selectedCampaignId]);

  const handleSave = async () => {
    if (!selectedCampaignId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          objectives: objectives.split("\n").filter((o) => o.trim()),
        }),
      });
      if (res.ok) {
        setMessage("Saved successfully!");
        refreshCampaigns(); // Update sidebar name
      } else {
        setMessage("Failed to save.");
      }
    } catch (e) {
      setMessage("Error saving.");
    }
    setLoading(false);
  };

  const handleCrawl = async () => {
    // Auto-save the current url/objectives to the DB before crawling
    // so it doesn't accidentally crawl the old saved domain
    await handleSave();

    setCrawling(true);
    setMessage("");
    try {
      const res = await fetch("/api/crawl", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: selectedCampaignId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Crawled ${data.pagesCrawled} pages successfully.`);
        if (data.crawlStats) setCrawlStats({ ...data.crawlStats, pagesCrawled: data.pagesCrawled });
      } else {
        setMessage(`Crawl failed: ${data.error}`);
      }
    } catch (e) {
      setMessage("Error crawling.");
    }
    setCrawling(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          Project Settings
        </h1>
        <p className="text-slate-400">Configure your target domain and campaign objectives.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Campaign"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Domain URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Campaign Objectives (One per line)
          </label>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={5}
            placeholder="- Highlight our secure enterprise features&#10;- Emphasize easy 1-click deployment&#10;- Target enterprise decision makers"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>

          <button
            onClick={handleCrawl}
            disabled={crawling || !url}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 border border-slate-700"
          >
            {crawling ? "Crawling..." : "Run Web Crawler"}
          </button>

          {message && (
            <span className="text-sm text-slate-300 animate-pulse">{message}</span>
          )}
        </div>

        {crawlStats && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Crawler Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-slate-500 block">Pages Discovered:</span>
                <span className="text-indigo-400 font-mono">{crawlStats.pagesCrawled} pages</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Characters Extracted:</span>
                <span className="text-indigo-400 font-mono">{crawlStats.totalCharacters.toLocaleString()}</span>
              </div>
            </div>
            {crawlStats.crawledUrls && crawlStats.crawledUrls.length > 0 && (
              <div className="mb-4">
                <span className="text-slate-500 block text-xs mb-1">Scraped Pages:</span>
                <ul className="text-slate-400 text-xs list-disc pl-5">
                  {crawlStats.crawledUrls.map((u, i) => (
                    <li key={i} className="truncate" title={u}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="text-slate-500 block text-xs mb-1">Content Excerpt:</span>
              <p className="text-slate-400 text-xs italic border-l-2 border-indigo-500/50 pl-3">
                "{crawlStats.excerpt}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
