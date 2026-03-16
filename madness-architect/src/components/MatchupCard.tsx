import { motion } from 'framer-motion';
import type { Game, Team } from '../types/bracket';
import { useBracketStore } from '../store/useBracketStore';
import clsx from 'clsx';
import { Info } from 'lucide-react';

import teamMarketData from '../data/team-market-data.json';

interface MatchupCardProps {
    game: Game;
    regionId: string;
    roundLevel: number;
    gameIndex: number;
    onInfoClick?: (team: Team) => void;
    onPick?: () => void;
}

export default function MatchupCard({ game, regionId, roundLevel, gameIndex, onInfoClick, onPick }: MatchupCardProps) {
    const advanceTeam = useBracketStore(state => state.advanceTeam);

    const handlePick = (team: Team | null) => {
        if (!team) return;
        advanceTeam(regionId, roundLevel, gameIndex, team);
        // Very short delay so the winner highlight flashes before advancing
        setTimeout(() => onPick?.(), 50);
    };

    const isTeam1Winner = game.winner?.id === game.team1?.id;
    const isTeam2Winner = game.winner?.id === game.team2?.id;

    const renderTeam = (team: Team | null, isTop: boolean, isWinner: boolean) => {
        const teamData = team ? (teamMarketData as any)[team.id] : null;

        return (
            <div
                onClick={() => handlePick(team)}
                className={clsx(
                    "relative flex items-center justify-between p-4 cursor-pointer transition-colors duration-200",
                    !team ? "opacity-60 pointer-events-none" : "hover:bg-white/10 bg-white/5",
                    isTop ? "border-b border-white/10 rounded-t-xl" : "rounded-b-xl",
                    isWinner && "bg-white/20"
                )}
            >
                <div className="flex items-center gap-3 w-full min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 w-4 text-center">{team?.seed || '-'}</span>
                    <div className="flex flex-col min-w-0">
                        {team ? (
                            <motion.span
                                layoutId={`team-label-${team.id}-${roundLevel}`}
                                className={clsx(
                                    "font-sans font-medium text-sm truncate",
                                    isWinner ? "text-white font-bold" : "text-slate-200"
                                )}
                            >
                                {team.name}
                            </motion.span>
                        ) : (
                            <span className="font-sans font-medium text-sm text-slate-400 italic">TBD</span>
                        )}
                        {teamData && (
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-blue-400/80 uppercase tracking-tighter">
                                    Poly: {teamData.predictions.polymarket}
                                </span>
                                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">
                                    Line: {teamData.predictions.line}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {team && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onInfoClick?.(team); }}
                        className="p-1.5 rounded-full hover:bg-white/20 text-slate-500 hover:text-white transition-colors ml-2"
                    >
                        <Info size={12} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-panel w-64 shrink-0 flex flex-col my-2 h-auto"
        >
            {renderTeam(game.team1, true, isTeam1Winner)}
            {renderTeam(game.team2, false, isTeam2Winner)}
        </motion.div>
    );
}
