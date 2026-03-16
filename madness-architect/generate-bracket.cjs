const fs = require('fs');

const regions = ['East', 'West', 'South', 'Midwest'];

const generateRegion = (regionName, prefix) => {
    const seeds = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

    const round1 = [];
    for (let i = 0; i < 8; i++) {
        round1.push({
            id: `${prefix}${i + 1}`,
            nextGameId: `${prefix}${8 + Math.floor(i / 2) + 1}`,
            team1: { id: `${prefix}_t${seeds[i * 2]}`, name: `${regionName} Team ${seeds[i * 2]}`, seed: seeds[i * 2] },
            team2: { id: `${prefix}_t${seeds[i * 2 + 1]}`, name: `${regionName} Team ${seeds[i * 2 + 1]}`, seed: seeds[i * 2 + 1] },
            winner: null
        });
    }

    const round2 = [];
    for (let i = 0; i < 4; i++) {
        round2.push({
            id: `${prefix}${9 + i}`,
            nextGameId: `${prefix}${12 + Math.floor(i / 2) + 1}`,
            team1: null,
            team2: null,
            winner: null
        });
    }

    const round3 = [];
    for (let i = 0; i < 2; i++) {
        round3.push({
            id: `${prefix}${13 + i}`,
            nextGameId: `${prefix}15`,
            team1: null,
            team2: null,
            winner: null
        });
    }

    const round4 = [
        {
            id: `${prefix}15`,
            nextGameId: `ff_${prefix}`, // Points to Final Four
            team1: null,
            team2: null,
            winner: null
        }
    ];

    return {
        id: regionName.toLowerCase(),
        name: regionName,
        rounds: {
            round1,
            round2,
            round3,
            round4
        }
    };
};

const bracket = {
    regions: {
        East: generateRegion('East', 'e'),
        West: generateRegion('West', 'w'),
        South: generateRegion('South', 's'),
        Midwest: generateRegion('Midwest', 'm')
    },
    finalFour: {
        id: 'finalfour',
        name: 'Final Four',
        rounds: {
            round5: [
                { id: 'ff_1', nextGameId: 'ff_3', team1: null, team2: null, winner: null }, // East vs West
                { id: 'ff_2', nextGameId: 'ff_3', team1: null, team2: null, winner: null }, // South vs Midwest
            ],
            round6: [
                { id: 'ff_3', nextGameId: null, team1: null, team2: null, winner: null } // Championship
            ]
        }
    }
};

fs.writeFileSync('./src/data/initial-bracket.json', JSON.stringify(bracket, null, 2));
console.log('Bracket generated');
