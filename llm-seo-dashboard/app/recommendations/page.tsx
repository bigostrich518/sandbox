"use client";

import { useState, useEffect, useCallback } from "react";
import { useMockMode } from "@/components/MockModeContext";
import { useCampaign } from "@/components/CampaignContext";

export default function RecommendationsPage() {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const { isMockMode } = useMockMode();

  const { selectedCampaignId } = useCampaign();

  // Content generation state — keyed by recommendation index
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<number, string>>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!selectedCampaignId) {
      setRecommendation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/recommendations?campaignId=${selectedCampaignId}`);
      const data = await res.json();
      if (data && data.content) {
        setRecommendation(JSON.parse(data.content));
      } else {
        setRecommendation(null);
      }
    } catch (e) {
      console.error("Failed to parse recommendations");
    }
    setLoading(false);
  }, [selectedCampaignId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Reset generated content when campaign changes
  useEffect(() => {
    setGeneratedContent({});
    setCopiedIdx(null);
  }, [selectedCampaignId]);

  const handleAnalyze = async () => {
    if (!selectedCampaignId) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockMode: isMockMode,
          campaignId: selectedCampaignId,
          model: selectedModel.replace("|grounded", ""),
          useGrounding: selectedModel.endsWith("|grounded"),
        }),
      });
      const data = await res.json();

      if (res.ok && data.recommendation) {
        setRecommendation(JSON.parse(data.recommendation.content));
        setGeneratedContent({});
      } else {
        setError(data.error || "Failed to analyze");
      }
    } catch (e) {
      setError("Analysis task failed.");
    }
    setAnalyzing(false);
  };

  const handleGenerateContent = async (recText: string, idx: number) => {
    if (!selectedCampaignId) return;
    setGeneratingIdx(idx);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationText: recText,
          campaignId: selectedCampaignId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setGeneratedContent((prev) => ({ ...prev, [idx]: data.content }));
      }
    } catch (e) {
      console.error("Content generation failed:", e);
    }
    setGeneratingIdx(null);
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const getOverallHealth = () => {
    if (!recommendation?.scores) return "Unknown";
    const avg = recommendation.scores.reduce((acc: number, s: any) => acc + s.score, 0) / recommendation.scores.length;
    if (avg >= 8) return "Excellent";
    if (avg >= 5) return "Moderate";
    return "Poor";
  };

  const getHealthColor = () => {
    const health = getOverallHealth();
    if (health === "Excellent") return "text-green-400";
    if (health === "Moderate") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Strategic Recommendations
          </h1>
          <p className="text-slate-400">
            AI-driven insights to improve your brand presence and sentiment across LLMs.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={analyzing}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-flash|grounded">Gemini 2.5 Flash + Search 🔍</option>
              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
            </select>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
            >
              <span className="text-xl">✨</span>
              {analyzing ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Generating strategic report...</div>
      ) : !recommendation ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-20 text-center text-slate-500">
          <div className="text-5xl mb-6">🎯</div>
          <p className="text-lg">No analysis available for this project.</p>
          <p className="text-sm mt-2">Click &quot;Run Analysis&quot; to get tailored content recommendations.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* TOP SECTION: Sentiment Health Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Brand Sentiment Health</h2>
                <div className="flex items-baseline gap-3">
                   <span className={`text-6xl font-black ${getHealthColor()}`}>{getOverallHealth()}</span>
                </div>
                <p className="text-slate-400 max-w-md">
                  Based on the latest model responses, your brand&apos;s alignment with its core objectives is currently <span className="text-white font-medium">{getOverallHealth().toLowerCase()}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                {recommendation.scores?.map((scoreObj: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 min-w-[180px]">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-500 uppercase">{scoreObj.modelName}</span>
                       <span className="text-sm font-bold text-white">{scoreObj.score}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          scoreObj.score >= 8 ? "bg-green-500" : scoreObj.score >= 5 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(scoreObj.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Detailed Brand Findings */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <span className="text-blue-400">🔍</span> Model Findings
              </h2>
              <div className="space-y-3">
                {recommendation.scores?.map((scoreObj: any, idx: number) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm leading-relaxed shadow-sm">
                    <span className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-tight">{scoreObj.modelName} Reasoning:</span>
                    <span className="text-slate-300 italic">&quot;{scoreObj.reasoning || "No reasoning provided."}&quot;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Recommendations with Content Generation */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <span className="text-purple-400">⚡</span> Content Recommendations
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {recommendation.recommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md hover:border-slate-600 transition-all group">
                    <div className="p-6 flex gap-5 items-start">
                      <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black shadow-lg shadow-purple-900/40">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {rec}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Priority High • Content Update
                          </span>
                          {!generatedContent[idx] && (
                            <button
                              onClick={() => handleGenerateContent(rec, idx)}
                              disabled={generatingIdx !== null}
                              className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-lg font-medium transition-colors border border-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {generatingIdx === idx ? (
                                <>
                                  <span className="animate-spin">⏳</span> Generating...
                                </>
                              ) : (
                                <>✨ Generate Content</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Generated Content Panel */}
                    {generatedContent[idx] && (
                      <div className="border-t border-slate-800 bg-slate-950/50 p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-green-500/70 uppercase tracking-wider flex items-center gap-1.5">
                            <span>✅</span> Generated Content
                          </span>
                          <button
                            onClick={() => handleCopy(generatedContent[idx], idx)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-medium transition-colors border border-slate-700 flex items-center gap-1.5"
                          >
                            {copiedIdx === idx ? (
                              <><span>✅</span> Copied!</>
                            ) : (
                              <><span>📋</span> Copy</>
                            )}
                          </button>
                        </div>
                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-800 max-h-64 overflow-y-auto custom-scrollbar">
                          {generatedContent[idx]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
