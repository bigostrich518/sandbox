import { useBracketStore } from '../store/useBracketStore';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, Check } from 'lucide-react';

const ROUND_LABELS: Record<number, string> = {
    1: 'Round of 64',
    2: 'Round of 32',
    3: 'Sweet 16',
    4: 'Elite Eight',
    5: 'Final Four',
    6: '🏆 Championship',
};

export default function BracketReview({ onBack }: { onBack: () => void }) {
    const regions = useBracketStore(state => state.regions);
    const finalFour = useBracketStore(state => state.finalFour);

    // Build all picks grouped by round
    type Pick = { winner: string; loser: string; region: string; roundLevel: number };
    const picksByRound: Record<number, Pick[]> = {};

    const regionsInOrder = ['East', 'West', 'South', 'Midwest'];
    for (let round = 1; round <= 4; round++) {
        picksByRound[round] = [];
        for (const reg of regionsInOrder) {
            const games = regions[reg]?.rounds[`round${round}`] || [];
            games.forEach(game => {
                if (game.winner && game.team1 && game.team2) {
                    const loser = game.winner.id === game.team1.id ? game.team2 : game.team1;
                    picksByRound[round].push({
                        winner: `(${game.winner.seed}) ${game.winner.name}`,
                        loser: `(${loser.seed}) ${loser.name}`,
                        region: reg,
                        roundLevel: round,
                    });
                }
            });
        }
    }

    // Final Four rounds (5 and 6)
    [5, 6].forEach(round => {
        picksByRound[round] = [];
        finalFour.rounds[`round${round}`]?.forEach(game => {
            if (game.winner && game.team1 && game.team2) {
                const loser = game.winner.id === game.team1.id ? game.team2 : game.team1;
                picksByRound[round].push({
                    winner: `(${game.winner.seed}) ${game.winner.name}`,
                    loser: `(${loser.seed}) ${loser.name}`,
                    region: round === 6 ? 'Championship' : 'Final Four',
                    roundLevel: round,
                });
            }
        });
    });

    const champion = finalFour.rounds['round6']?.[0]?.winner;
    const totalPicks = Object.values(picksByRound).flat().length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full max-w-2xl mx-auto flex flex-col p-6 overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pt-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-white">
                        Your Bracket
                    </h1>
                    <p className="text-slate-400 text-sm">{totalPicks} / 63 picks complete</p>
                </div>
            </div>

            {/* Champion callout */}
            {champion && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel-active p-5 mb-6 flex items-center gap-4 border border-yellow-400/30"
                >
                    <Trophy className="text-yellow-400 shrink-0" size={28} />
                    <div>
                        <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest mb-1">Your Champion</p>
                        <p className="text-xl font-bold text-white">({champion.seed}) {champion.name}</p>
                    </div>
                </motion.div>
            )}

            {/* Picks by round */}
            {[6, 5, 4, 3, 2, 1].map(round => {
                const picks = picksByRound[round] || [];
                if (picks.length === 0) return null;
                return (
                    <div key={round} className="mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-white/10 pb-2">
                            {ROUND_LABELS[round]}
                        </h2>
                        <div className="flex flex-col gap-2">
                            {picks.map((pick, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="glass-panel flex items-center justify-between px-4 py-2.5"
                                >
                                    <div className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        <span className="text-white font-medium text-sm">{pick.winner}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-xs">def.</span>
                                        <span className="text-slate-400 text-sm">{pick.loser}</span>
                                        {round <= 4 && (
                                            <span className="text-xs text-slate-600 ml-1">{pick.region}</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Confirm/Save button */}
            <div className="pb-8 pt-4">
                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                    <Trophy size={20} /> Save & Submit Bracket
                </button>
            </div>
        </motion.div>
    );
}
