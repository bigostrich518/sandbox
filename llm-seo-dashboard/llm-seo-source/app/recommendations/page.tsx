"use client";

import { useState, useEffect } from "react";
import { useMockMode } from "@/components/MockModeContext";

export default function RecommendationsPage() {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const { isMockMode } = useMockMode();

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations");
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
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockMode: isMockMode,
          model: selectedModel.replace("|grounded", ""),
          useGrounding: selectedModel.endsWith("|grounded"),
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.recommendation) {
        setRecommendation(JSON.parse(data.recommendation.content));
      } else {
        setError(data.error || "Failed to analyze");
      }
    } catch (e) {
      setError("Analysis task failed.");
    }
    setAnalyzing(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            AI Content Recommendations
          </h1>
          <p className="text-slate-400">
            Analyzes site content, objectives, and recent model responses. Use <strong className="text-slate-300">+ Search</strong> to enable real-time web grounding.
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
        <div className="p-12 text-center text-slate-500">Loading latest insights...</div>
      ) : !recommendation ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <div className="text-4xl mb-4">🔮</div>
          <p>No recommendations generated yet. Run the Analysis Engine above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Scores Overview */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-white">Sentiment Alignment Scores</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              {recommendation.scores?.map((scoreObj: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 truncate pr-4" title={scoreObj.promptText || `Prompt ${scoreObj.promptId}`}>
                      {scoreObj.modelName}
                    </span>
                    <span className="font-bold text-white">{scoreObj.score}/10</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
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

          {/* Actionable Recommendations */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white">Actionable Next Steps</h2>
            <div className="space-y-4">
              {recommendation.recommendations?.map((rec: string, idx: number) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex gap-4 items-start shadow-sm hover:border-slate-700 transition-colors">
                  <div className="bg-purple-500/20 text-purple-400 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold border border-purple-500/30">
                    {idx + 1}
                  </div>
                  <p className="text-slate-300 leading-relaxed pt-1">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
