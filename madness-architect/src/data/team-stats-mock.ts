export const MOCK_TEAM_STATS: Record<string, any> = {
    "e_t1": { "name": "East Team 1", "ppg": 85.2, "oppg": 62.1, "rebounds": 40.5, "assists": 18.2, "threePtPct": 38.5 },
    "e_t16": { "name": "East Team 16", "ppg": 70.1, "oppg": 75.4, "rebounds": 32.1, "assists": 12.0, "threePtPct": 31.2 },
    "w_t1": { "name": "West Team 1", "ppg": 82.0, "oppg": 65.0, "rebounds": 38.0, "assists": 19.5, "threePtPct": 39.0 }
};

export const getTeamStats = (teamId: string) => {
    // In a real app, this might query an API or parse a larger Kaggle CSV locally
    return MOCK_TEAM_STATS[teamId] || {
        name: "Unknown", ppg: 75.0, oppg: 70.0, rebounds: 35.0, assists: 15.0, threePtPct: 35.0
    };
};
