"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useMockMode } from "./MockModeContext";
import { useCampaign } from "./CampaignContext";

const navItems = [
  { name: "Settings", href: "/settings", icon: "⚙️" },
  { name: "Prompts", href: "/prompts", icon: "📝" },
  { name: "Responses", href: "/responses", icon: "🤖" },
  { name: "Recommendations", href: "/recommendations", icon: "💡" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMockMode, setIsMockMode } = useMockMode();
  const { campaigns, selectedCampaignId, setSelectedCampaignId, refreshCampaigns } = useCampaign();
  const [newProjectName, setNewProjectName] = useState("");

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, url: "https://example.com" }),
      });
      if (res.ok) {
        setNewProjectName("");
        await refreshCampaigns();
      }
    } catch (e) {
      console.error("Failed to add project");
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full hidden md:flex">
      <div className="p-6 border-b border-slate-800 space-y-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          LLM SEO Tracker
        </h1>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Active Project</label>
          <select
            value={selectedCampaignId || ""}
            onChange={(e) => setSelectedCampaignId(parseInt(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          >
            <option value="" disabled>Select a Project...</option>
            {Array.isArray(campaigns) && campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New Project Name..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
            />
            <button
              onClick={handleAddProject}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 mt-auto">
        <label className="flex items-center cursor-pointer justify-between group">
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
            Mock APIs
          </span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isMockMode}
              onChange={(e) => setIsMockMode(e.target.checked)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${isMockMode ? "bg-purple-500" : "bg-slate-700"}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isMockMode ? "transform translate-x-4" : ""}`}></div>
          </div>
        </label>
        <p className="text-xs text-slate-500 mt-2">
          {isMockMode ? "Using dummy data." : "Live APIs active."}
        </p>
      </div>
    </div>
  );
}
