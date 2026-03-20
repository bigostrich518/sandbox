"use client";

import { useState, useEffect, useCallback } from "react";
import { useCampaign } from "@/components/CampaignContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

const MODEL_COLORS: Record<string, string> = {
  "gemini-2.5-flash": "#a78bfa",
  "gemini-3-flash-preview": "#60a5fa",
  "gemini-3.1-flash-lite-preview": "#34d399",
  "gpt-4o-mini": "#3b82f6",
  "claude-3-5-haiku": "#f97316",
  "gemini-flash": "#c084fc",
};

const FALLBACK_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#f472b6", "#fbbf24", "#fb923c"];

function getModelColor(model: string, index: number): string {
  return MODEL_COLORS[model] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function getScoreColorHex(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

interface AnalyticsData {
  timeSeries: Record<string, any>[];
  modelAverages: { model: string; avgScore: number; responseCount: number }[];
  models: string[];
  summary: {
    totalResponses: number;
    avgSentiment: number;
    bestModel: string | null;
    worstModel: string | null;
    latestPoll: string | null;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const { selectedCampaignId } = useCampaign();

  const fetchAnalytics = useCallback(async () => {
    if (!selectedCampaignId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?campaignId=${selectedCampaignId}&range=${range}`
      );
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    }
    setLoading(false);
  }, [selectedCampaignId, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400">
            Sentiment trends and model performance over time.
          </p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {["7d", "30d", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                range === r
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500 animate-pulse">
          Loading analytics...
        </div>
      ) : !data || data.summary.totalResponses === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-20 text-center text-slate-500 shadow-xl">
          <div className="text-5xl mb-6">📊</div>
          <p className="text-lg">No response data yet.</p>
          <p className="text-sm mt-2">
            Go to the Prompts tab and run the polling engine to start collecting
            data.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Responses"
              value={data.summary.totalResponses.toString()}
              icon="📈"
              accent="text-blue-400"
            />
            <SummaryCard
              label="Avg Sentiment"
              value={`${data.summary.avgSentiment}/10`}
              icon="🎯"
              accent={
                data.summary.avgSentiment >= 8
                  ? "text-green-400"
                  : data.summary.avgSentiment >= 5
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            />
            <SummaryCard
              label="Best Model"
              value={data.summary.bestModel || "—"}
              icon="🏆"
              accent="text-green-400"
            />
            <SummaryCard
              label="Last Polled"
              value={
                data.summary.latestPoll
                  ? new Date(data.summary.latestPoll).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
                    )
                  : "Never"
              }
              icon="🕐"
              accent="text-slate-300"
            />
          </div>

          {/* Sentiment Over Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-purple-400">📉</span> Sentiment Over Time
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    labelFormatter={(label) => formatDate(String(label))}
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />
                  {data.models.map((model, idx) => (
                    <Line
                      key={model}
                      type="monotone"
                      dataKey={model}
                      stroke={getModelColor(model, idx)}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-blue-400">📊</span> Model Comparison
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.modelAverages} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 10]}
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="model"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    width={160}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    formatter={(value: any) => [`${value}/10`, "Avg Score"]}
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Bar dataKey="avgScore" radius={[0, 8, 8, 0]} barSize={28}>
                    {data.modelAverages.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={getScoreColorHex(entry.avgScore)}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-black ${accent} truncate`}>{value}</div>
    </div>
  );
}
