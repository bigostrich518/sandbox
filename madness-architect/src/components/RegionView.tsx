import type { Region } from '../types/bracket';
import MatchupCard from './MatchupCard';
import { useBracketStore } from '../store/useBracketStore';

interface RegionViewProps {
    region: Region;
}

export default function RegionView({ region }: RegionViewProps) {
    const numRounds = Object.keys(region.rounds).length; // Usually 4 for a normal region
    const setSelectedTeam = useBracketStore(state => state.setSelectedTeam);

    return (
        <div className="flex-1 min-w-[100vw] sm:min-w-[400px] h-full overflow-y-auto hide-scroll px-4 py-8 Region-Snap-Child">
            <h2 className="text-3xl font-display font-bold text-center mb-8 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {region.name} Region
            </h2>

            <div className="flex flex-row gap-8 min-w-max pb-12 px-4">
                {Object.entries(region.rounds).map(([roundStr, games], roundIdx) => {
                    const roundLevel = parseInt(roundStr.replace('round', ''), 10);

                    return (
                        <div key={roundStr} className="flex flex-col justify-around" style={{
                            // Create visual offset for descending bracket wedge shape
                            margin: `${roundIdx * 2.5}rem 0`
                        }}>
                            <h3 className="text-center font-sans text-sm font-semibold text-slate-400 uppercase mb-4 tracking-wider">
                                Round {roundLevel}
                            </h3>
                            {games.map((game, gIdx) => (
                                <div key={game.id} className="relative flex items-center">
                                    <MatchupCard
                                        game={game}
                                        regionId={region.id}
                                        roundLevel={roundLevel}
                                        gameIndex={gIdx}
                                        onInfoClick={setSelectedTeam}
                                    />
                                    {/* Connector Lines (optional later aesthetic enhancement) */}
                                    {roundLevel < numRounds && (
                                        <div className="absolute -right-4 top-1/2 w-4 border-t border-white/20" />
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
