import { useMemo, useCallback, useState } from 'react';
import { useBracketStore } from '../store/useBracketStore';
import MatchupCard from './MatchupCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Flag } from 'lucide-react';
import type { SequenceGame, Game } from '../types/bracket';
import BracketReview from './BracketReview';
import teamMarketData from '../data/team-market-data.json';

function buildSequence(
    regions: ReturnType<typeof useBracketStore.getState>['regions'],
    finalFour: ReturnType<typeof useBracketStore.getState>['finalFour']
): SequenceGame[] {
    const seq: SequenceGame[] = [];
    const regionsInOrder = ['East', 'West', 'South', 'Midwest'];
    for (let round = 1; round <= 4; round++) {
        const rStr = `round${round}`;
        for (const reg of regionsInOrder) {
            const games = regions[reg]?.rounds[rStr] || [];
            games.forEach((g: Game, idx: number) => {
                seq.push({ gameInfo: g, regionId: reg.toLowerCase(), roundLevel: round, gameIndex: idx });
            });
        }
    }
    finalFour.rounds['round5']?.forEach((g: Game, idx: number) => {
        seq.push({ gameInfo: g, regionId: 'finalfour', roundLevel: 5, gameIndex: idx });
    });
    finalFour.rounds['round6']?.forEach((g: Game, idx: number) => {
        seq.push({ gameInfo: g, regionId: 'finalfour', roundLevel: 6, gameIndex: idx });
    });
    return seq;
}

const StatsPanel = ({ teamId, label }: { teamId: string | undefined, label: string }) => {
    const data = teamId ? (teamMarketData as any)[teamId] : null;
    
    if (!data) return (
        <div className="flex-1 bg-slate-900/40 rounded-2xl p-4 border border-white/5 animate-pulse min-h-[160px]">
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-slate-800 rounded"></div>
                <div className="h-8 bg-slate-800 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 bg-slate-900/60 rounded-2xl p-5 border border-white/10 backdrop-blur-md">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">{label} Analysis</h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {/* Stats */}
                <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">PPG</p>
                    <p className="text-xl font-display font-bold text-white">{data.stats.ppg}</p>
                </div>
                <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">3PT%</p>
                    <p className="text-xl font-display font-bold text-emerald-400">{data.stats.threePct}</p>
                </div>
                
                {/* Predictions */}
                <div className="col-span-2 pt-2 border-t border-white/5 mt-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase mb-3">Market Sentiment</p>
                    <div className="flex justify-between items-center bg-black/30 rounded-lg p-3">
                        <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold mb-1">Polymarket</p>
                            <p className="text-sm font-bold text-blue-400">{data.predictions.polymarket}</p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold mb-1">Kalshi</p>
                            <p className="text-sm font-bold text-purple-400">{data.predictions.kalshi}</p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[9px] text-slate-500 font-bold mb-1">Vegas Line</p>
                            <p className="text-sm font-bold text-orange-400">{data.predictions.line}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function WizardView({ onInfoClick }: { onInfoClick: (team: any) => void }) {
    const [showReview, setShowReview] = useState(false);
    const regions = useBracketStore(state => state.regions);
    const finalFour = useBracketStore(state => state.finalFour);
    const activeIndex = useBracketStore(state => state.activeGameSequenceIndex);
    const nextGameWizard = useBracketStore(state => state.nextGameWizard);
    const prevGameWizard = useBracketStore(state => state.prevGameWizard);
    const setActiveGameSequenceIndex = useBracketStore(state => state.setActiveGameSequenceIndex);

    const sequence = useMemo(() => buildSequence(regions, finalFour), [regions, finalFour]);

    const handlePick = useCallback(() => {
        const s = useBracketStore.getState();
        const freshSeq = buildSequence(s.regions, s.finalFour);
        let nextIdx = s.activeGameSequenceIndex + 1;
        while (nextIdx < freshSeq.length) {
            const g = freshSeq[nextIdx].gameInfo;
            if (g.team1 && g.team2 && !g.winner) break;
            if (g.team1 && g.team2 && g.winner) { nextIdx++; continue; }
            return;
        }
        if (nextIdx < freshSeq.length) {
            setActiveGameSequenceIndex(nextIdx);
        }
    }, [setActiveGameSequenceIndex]);

    const activeSequenceGame = sequence[activeIndex];
    if (!activeSequenceGame) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>;

    if (showReview) return <BracketReview onBack={() => setShowReview(false)} />;

    const { gameInfo, regionId, roundLevel, gameIndex } = activeSequenceGame;
    const totalPicked = sequence.filter(s => s.gameInfo.winner != null).length;
    const progressPercent = Math.round((totalPicked / 63) * 100);
    const isLastGame = activeIndex === sequence.length - 1;

    return (
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center p-6 py-12 relative min-h-full">

            {/* Header / Progress */}
            <div className="w-full flex flex-col items-center mb-12">
                <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">
                    {regionId === 'finalfour'
                        ? (roundLevel === 6 ? '🏆 Championship' : '🏀 Final Four')
                        : `${regionId.charAt(0).toUpperCase() + regionId.slice(1)} Region`}
                    {' '}• Round {roundLevel}
                </h2>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden max-w-md">
                    <motion.div
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.4 }}
                        className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full"
                    />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{totalPicked} / 63 picks</p>
            </div>

            {/* Main Content Area */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-slate-900/20 p-8 lg:p-12 rounded-[40px] border border-white/5 backdrop-blur-sm self-center">
                
                {/* Left: Matchup Focus */}
                <div className="lg:col-span-7 flex flex-col items-center order-1 lg:order-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={gameInfo.id}
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.95 }}
                            transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full flex justify-center"
                        >
                            <div className="scale-110 lg:scale-[1.5] origin-center">
                                <MatchupCard
                                    game={gameInfo}
                                    regionId={regionId}
                                    roundLevel={roundLevel}
                                    gameIndex={gameIndex}
                                    onInfoClick={onInfoClick}
                                    onPick={handlePick}
                                />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right: Data Insights Panes */}
                <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-2">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`stats-${gameInfo.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-4 h-full"
                        >
                            <StatsPanel teamId={gameInfo.team1?.id} label={gameInfo.team1?.name || 'Home Team'} />
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Matchup Data</span>
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                            </div>
                            <StatsPanel teamId={gameInfo.team2?.id} label={gameInfo.team2?.name || 'Away Team'} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="mt-12 flex justify-center items-center gap-12">
                <button
                    onClick={prevGameWizard}
                    disabled={activeIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                {isLastGame && gameInfo.winner ? (
                    <button
                        onClick={() => setShowReview(true)}
                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                        <Flag size={18} /> Review Bracket
                    </button>
                ) : (
                    <button
                        onClick={nextGameWizard}
                        disabled={isLastGame}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
                    >
                        Skip <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
