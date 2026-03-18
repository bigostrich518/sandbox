"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMockMode } from "./MockModeContext";

const navItems = [
  { name: "Settings", href: "/settings", icon: "⚙️" },
  { name: "Prompts", href: "/prompts", icon: "📝" },
  { name: "Responses", href: "/responses", icon: "🤖" },
  { name: "Recommendations", href: "/recommendations", icon: "💡" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMockMode, setIsMockMode } = useMockMode();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          LLM SEO Tracker
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
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
