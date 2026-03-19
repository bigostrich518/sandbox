"use client";

import { useState, useEffect, useCallback } from "react";
import { useCampaign } from "@/components/CampaignContext";

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { selectedCampaignId } = useCampaign();

  const fetchResponses = useCallback(async () => {
    if (!selectedCampaignId) {
      setResponses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/responses?campaignId=${selectedCampaignId}`);
    const data = await res.json();
    setResponses(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedCampaignId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const getModelColor = (modelName: string) => {
    if (modelName.includes("gpt")) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (modelName.includes("claude")) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    if (modelName.includes("gemini")) return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    return "text-slate-400 border-slate-500/30 bg-slate-500/10";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Model Sentiment & Responses
          </h1>
          <p className="text-slate-400">
            Analysis of how different AI models rank and perceive your brand.
          </p>
        </div>
        <button
          onClick={fetchResponses}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500 animate-pulse">Analyzing responses...</div>
      ) : responses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center text-slate-500 shadow-xl">
          <div className="text-5xl mb-6">📉</div>
          <p className="text-lg">No responses recorded yet.</p>
          <p className="text-sm mt-2">Go to the Prompts tab to trigger the polling engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {responses.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition-all shadow-lg group">
              {/* Header: Model & Date */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getModelColor(r.modelName)}`}>
                    {r.modelName}
                  </span>
                  {r.isMock && (
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-bold">MOCK</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {new Date(r.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Sentiment Score Section */}
              <div className="p-6 bg-slate-950/20 border-b border-slate-800/50">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-semibold text-slate-300">Sentiment Score</span>
                  <span className="text-2xl font-black text-white">{r.sentimentScore || "N/A"}<span className="text-xs text-slate-500 font-normal ml-1">/10</span></span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${getScoreColor(r.sentimentScore || 0)}`}
                    style={{ width: `${(r.sentimentScore || 0) * 10}%` }}
                  />
                </div>
                {r.reasoning && (
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-800 italic text-sm text-slate-400 line-clamp-2" title={r.reasoning}>
                    "{r.reasoning}"
                  </div>
                )}
              </div>

              {/* Main Response Content */}
              <div className="p-6 flex-1 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Prompt Input</label>
                  <p className="text-sm text-slate-400 bg-slate-800/20 p-3 rounded-lg border border-slate-800/50 line-clamp-2">
                    {r.prompt?.text || "Unknown Prompt"}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Detailed Response</label>
                  <div className="text-slate-200 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {r.responseText}
                  </div>
                </div>
              </div>

              {/* Footer: Status */}
              <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-end">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${r.isMock ? "bg-yellow-500" : "bg-green-500"} animate-pulse`} />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{r.isMock ? "Mock Data" : "Live API Response"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
