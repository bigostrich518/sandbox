export interface Team {
    id: string;
    name: string;
    seed: number;
}

export interface Game {
    id: string;
    nextGameId: string | null;
    team1: Team | null;
    team2: Team | null;
    winner: Team | null;
}

export interface Region {
    id: string;
    name: string;
    rounds: Record<string, Game[]>;
}

export interface BracketState {
    regions: Record<string, Region>;
    finalFour: Region;
}

export interface SequenceGame {
    gameInfo: Game;
    regionId: string;
    roundLevel: number;
    gameIndex: number;
}
