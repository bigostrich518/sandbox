"use client";

import { useState, useEffect, useCallback } from "react";
import { useMockMode } from "@/components/MockModeContext";
import { useCampaign } from "@/components/CampaignContext";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const { isMockMode } = useMockMode();
  const { selectedCampaignId } = useCampaign();
  const [message, setMessage] = useState("");

  const fetchPrompts = useCallback(async () => {
    if (!selectedCampaignId) {
      setPrompts([]);
      return;
    }
    const res = await fetch(`/api/prompts?campaignId=${selectedCampaignId}`);
    const data = await res.json();
    setPrompts(Array.isArray(data) ? data : []);
  }, [selectedCampaignId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    if (!selectedCampaignId) return;
    setLoading(true);
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newPrompt, campaignId: selectedCampaignId }),
    });
    setNewPrompt("");
    await fetchPrompts();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    await fetchPrompts();
  };

  const handlePoll = async () => {
    setPolling(true);
    setMessage("Polling models...");
    try {
      const res = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockMode: isMockMode, campaignId: selectedCampaignId }),
      });
      const data = await res.json();
      if (res.ok && data.count > 0) {
        setMessage(`Success! Recorded ${data.count} new responses.`);
      } else if (res.ok && data.errors?.length) {
        setMessage(`API errors: ${data.errors.join("; ")}`);
      } else if (res.ok) {
        setMessage("No responses recorded. Check your API key and prompts.");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      setMessage("Polling failed.");
    }
    setPolling(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Tracked Prompts
          </h1>
          <p className="text-slate-400">
            Define the questions you want to track across the base AI models.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handlePoll}
            disabled={polling || prompts.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-xl">🚀</span>
            {polling ? "Running..." : "Run Polling Engine"}
          </button>
          {message && <span className="text-sm text-slate-400">{message}</span>}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-800 flex gap-4 bg-slate-900/50">
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="e.g. What is the best feature of ExampleCorp?"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !newPrompt}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <div className="divide-y divide-slate-800">
          {prompts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No prompts tracked yet. Add one above.</div>
          ) : (
            prompts.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-200">{p.text}</span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
