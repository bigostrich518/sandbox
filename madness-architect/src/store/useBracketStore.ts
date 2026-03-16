import { create } from 'zustand';
import initialBracketData from '../data/initial-bracket.json';
import type { BracketState, Team } from '../types/bracket';

interface BracketStore extends BracketState {
    advanceTeam: (regionId: string, roundLevel: number, gameIndex: number, winningTeam: Team) => void;
    resetGame: (regionId: string, roundLevel: number, gameIndex: number) => void;
    selectedTeam: Team | null;
    setSelectedTeam: (team: Team | null) => void;
    
    // Wizard State Navigation
    activeGameSequenceIndex: number;
    nextGameWizard: () => void;
    prevGameWizard: () => void;
    setActiveGameSequenceIndex: (index: number) => void;
}

// Deep clone initial state
const getInitialState = (): BracketState => JSON.parse(JSON.stringify(initialBracketData));

export const useBracketStore = create<BracketStore>((set) => ({
    ...getInitialState(),
    selectedTeam: null,
    setSelectedTeam: (team) => set({ selectedTeam: team }),

    advanceTeam: (regionId, roundLevel, gameIndex, winningTeam) => set((state) => {
        // CRITICAL: Only clone the DATA portions of state, NOT the entire state object.
        // JSON.stringify strips function properties, so cloning `state` directly would
        // remove all Zustand action methods, causing an infinite render loop.
        const newRegions = JSON.parse(JSON.stringify(state.regions));
        const newFinalFour = JSON.parse(JSON.stringify(state.finalFour));

        let game;
        let nextGame;
        const isFinalFour = regionId === 'finalfour';

        // Fix casing for region index since initial data uses Capitalized keys
        const regKey = isFinalFour ? 'finalfour' : (regionId.charAt(0).toUpperCase() + regionId.slice(1));

        // Locate current game
        if (isFinalFour) {
            const currentRoundStr = `round${roundLevel}`;
            game = newFinalFour.rounds[currentRoundStr][gameIndex];
        } else {
            const currentRoundStr = `round${roundLevel}`;
            game = newRegions[regKey].rounds[currentRoundStr][gameIndex];
        }

        if (!game || !game.team1 || !game.team2) {
            console.warn("Cannot advance from a game that is missing teams.");
            return state; // No skip rule
        }

        game.winner = winningTeam;

        // Helper to recursively clear descendant dependencies (Cascading Reset)
        const cascadeReset = (regId: string, rLvl: number, gIdx: number, teamIdToClear: string) => {
            let nGame;
            let isFF = regId === 'finalfour';
            const cRegKey = isFF ? 'finalfour' : (regId.charAt(0).toUpperCase() + regId.slice(1));

            if (isFF) {
                const nrStr = `round${rLvl + 1}`;
                if (!newFinalFour.rounds[nrStr]) return;
                const nIndex = Math.floor(gIdx / 2);
                nGame = newFinalFour.rounds[nrStr][nIndex];
            } else {
                if (rLvl === 4) {
                    const rMap: Record<string, { fGame: number, isTeam1: boolean }> = {
                        'east': { fGame: 0, isTeam1: true },
                        'west': { fGame: 0, isTeam1: false },
                        'south': { fGame: 1, isTeam1: true },
                        'midwest': { fGame: 1, isTeam1: false }
                    };
                    const map = rMap[regId.toLowerCase()];
                    if (!map) return;
                    nGame = newFinalFour.rounds['round5'][map.fGame];
                    isFF = true;
                    rLvl = 4;
                    gIdx = map.fGame;
                } else {
                    const nrStr = `round${rLvl + 1}`;
                    const nIndex = Math.floor(gIdx / 2);
                    nGame = newRegions[cRegKey].rounds[nrStr][nIndex];
                }
            }

            if (!nGame) return;

            let cleared = false;
            if (nGame.team1?.id === teamIdToClear) {
                nGame.team1 = null;
                cleared = true;
            } else if (nGame.team2?.id === teamIdToClear) {
                nGame.team2 = null;
                cleared = true;
            }

            if (nGame.winner?.id === teamIdToClear) {
                nGame.winner = null;
                cleared = true;
            }

            if (cleared) {
                const nextRegLvl = isFF && !regId.includes('final') && rLvl === 4 ? 5 : rLvl + 1;
                const nextRegId = isFF ? 'finalfour' : regId;
                const nextGIdx = isFF && !regId.includes('final') && rLvl === 4 ? gIdx : Math.floor(gIdx / 2);

                cascadeReset(nextRegId, nextRegLvl, nextGIdx, teamIdToClear);
            }
        };

        let nGameTargetLvl = roundLevel + 1;
        let nGameTargetReg = regionId;
        let nGameTargetIdx = Math.floor(gameIndex / 2);

        if (regionId !== 'finalfour' && roundLevel === 4) {
            nGameTargetReg = 'finalfour';
            nGameTargetLvl = 5;
            const rMap: Record<string, { fGame: number, isTeam1: boolean }> = {
                'east': { fGame: 0, isTeam1: true },
                'west': { fGame: 0, isTeam1: false },
                'south': { fGame: 1, isTeam1: true },
                'midwest': { fGame: 1, isTeam1: false }
            };
            const map = rMap[regionId.toLowerCase()];
            if (map) {
                nGameTargetIdx = map.fGame;
                nextGame = newFinalFour.rounds['round5'][nGameTargetIdx];

                const oldTeam = map.isTeam1 ? nextGame.team1 : nextGame.team2;
                if (oldTeam && oldTeam.id !== winningTeam.id) {
                    cascadeReset(nGameTargetReg, nGameTargetLvl, nGameTargetIdx, oldTeam.id);
                }

                if (map.isTeam1) nextGame.team1 = winningTeam;
                else nextGame.team2 = winningTeam;
            }

        } else if (regionId === 'finalfour' && roundLevel === 6) {
            nextGame = null;
        } else {
            const nextRoundStr = `round${roundLevel + 1}`;
            if (isFinalFour) {
                nextGame = newFinalFour.rounds[nextRoundStr][nGameTargetIdx];
            } else {
                nextGame = newRegions[regKey].rounds[nextRoundStr][nGameTargetIdx];
            }

            const isTeam1 = gameIndex % 2 === 0;
            const oldTeam = isTeam1 ? nextGame.team1 : nextGame.team2;

            if (oldTeam && oldTeam.id !== winningTeam.id) {
                cascadeReset(nGameTargetReg, nGameTargetLvl, nGameTargetIdx, oldTeam.id);
            }

            if (isTeam1) nextGame.team1 = winningTeam;
            else nextGame.team2 = winningTeam;
        }

        return { regions: newRegions, finalFour: newFinalFour };
    }),

    resetGame: (_regionId: string, _roundLevel: number, _gameIndex: number) => set((state) => {
        // Similar to advance, but just clears and cascades
        return state;
    }),

    activeGameSequenceIndex: 0,
    nextGameWizard: () => set((state) => {
        // Standard bracket has 63 games (0 to 62 index)
        if (state.activeGameSequenceIndex < 62) {
            return { activeGameSequenceIndex: state.activeGameSequenceIndex + 1 };
        }
        return state;
    }),
    prevGameWizard: () => set((state) => {
        if (state.activeGameSequenceIndex > 0) {
            return { activeGameSequenceIndex: state.activeGameSequenceIndex - 1 };
        }
        return state;
    }),
    setActiveGameSequenceIndex: (index: number) => set({ activeGameSequenceIndex: index })
}));
