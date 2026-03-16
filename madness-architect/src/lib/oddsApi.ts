import { useState, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_ODDS_API_KEY || 'placeholder-odds-key';
const SPORT_KEY = 'basketball_ncaab';

export interface GameOdds {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
    bookmakers: any[];
}

export function useOddsData() {
    const [odds, setOdds] = useState<GameOdds[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we fetch from the API. For now, simulate the fetch.
        const fetchOdds = async () => {
            try {
                if (API_KEY === 'placeholder-odds-key') {
                    // Provide mock data if no key
                    setOdds([
                        { id: '1', home_team: 'East Team 1', away_team: 'East Team 16', commence_time: new Date().toISOString(), bookmakers: [] }
                    ]);
                    return;
                }

                const res = await fetch(`https://api.the-odds-api.com/v4/sports/${SPORT_KEY}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads&oddsFormat=american`);
                if (!res.ok) throw new Error('Failed to fetch odds');
                const data = await res.json();
                setOdds(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOdds();
    }, []);

    return { odds, loading };
}
