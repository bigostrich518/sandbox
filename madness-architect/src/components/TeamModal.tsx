import type { Team } from '../types/bracket';
import { getTeamStats } from '../data/team-stats-mock';
import { X } from 'lucide-react';

interface TeamModalProps {
    team: Team;
    onClose: () => void;
}

export default function TeamModal({ team, onClose }: TeamModalProps) {
    const stats = getTeamStats(team.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg overflow-hidden relative" role="dialog" aria-modal="true">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={20} className="text-slate-300 hover:text-white" />
                </button>

                <div className="p-8">
                    <div className="mb-6 border-b border-white/10 pb-4">
                        <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                            {team.name}
                        </h2>
                        <p className="font-sans text-slate-400 font-medium">Seed: {team.seed}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Points Per Game" value={stats.ppg} />
                        <StatCard label="Opp. Points" value={stats.oppg} />
                        <StatCard label="Rebounds / G" value={stats.rebounds} />
                        <StatCard label="Assists / G" value={stats.assists} />
                        <StatCard label="3pt %" value={`${stats.threePtPct}%`} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 transition-colors hover:bg-white/10">
            <p className="text-xs font-sans text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold font-display text-white">{value}</p>
        </div>
    );
}
