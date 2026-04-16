/**
 * Americano Padel Scheduler
 * 
 * Generates a tournament schedule respecting these constraints:
 * - Partners: a player should never play with the same partner twice (ideal)
 * - Opponents: a player should not face the same duo more than 2 times
 * - Courts: fair distribution across courts
 * - Rest: if players > courts*4, rest rotation must be fair
 * 
 * Scoring: pScore*10 + oScore gives absolute priority to partner uniqueness
 */

/**
 * Generate all combinations of size k from an array
 */
function combinations(arr, k) {
  const result = [];
  function helper(start, combo) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

/**
 * Create an NxN matrix initialized to 0
 */
function createMatrix(n) {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/**
 * Score a potential pair (team) based on how many times they've been partners
 */
function pairScore(a, b, partnerCount) {
  return partnerCount[a][b];
}

/**
 * Score opponents: sum of opponentCount for all 4 cross-team matchups
 */
function opponentScore(team1, team2, opponentCount) {
  let score = 0;
  for (const a of team1) {
    for (const b of team2) {
      score += opponentCount[a][b];
    }
  }
  return score;
}

/**
 * Main scheduling function
 * @param {number} nbPlayers - total number of players
 * @param {number} nbCourts - number of available courts
 * @param {number} nbRounds - number of rounds to generate
 * @returns {Array} - array of round objects with matches and resting players
 */
export function generateSchedule(nbPlayers, nbCourts, nbRounds) {
  const playersPerMatch = 4;
  const playersPerRound = nbCourts * playersPerMatch;
  const hasResting = nbPlayers > playersPerRound;

  // Constraint matrices (indexed by player index 0..nbPlayers-1)
  const partnerCount = createMatrix(nbPlayers);
  const opponentCount = createMatrix(nbPlayers);
  const restCount = new Array(nbPlayers).fill(0);
  const courtCount = Array.from({ length: nbPlayers }, () => new Array(nbCourts).fill(0));
  const matchCount = new Array(nbPlayers).fill(0);

  const rounds = [];

  for (let r = 0; r < nbRounds; r++) {
    // 1. Select resting players (those with lowest restCount)
    let activePlayers;
    let restingPlayers = [];

    if (hasResting) {
      const nbResting = nbPlayers - playersPerRound;
      // Sort players by restCount ascending, break ties randomly
      const allPlayers = Array.from({ length: nbPlayers }, (_, i) => i);
      allPlayers.sort((a, b) => {
        const diff = restCount[a] - restCount[b];
        if (diff !== 0) return diff;
        // Secondary: prefer resting those who played more
        const matchDiff = matchCount[b] - matchCount[a];
        if (matchDiff !== 0) return matchDiff;
        return Math.random() - 0.5;
      });

      // Players with lowest rest count should play → rest the ones at the end
      // Actually, players who rested the least should rest now
      // Sort ascending by restCount → first ones have rested least... no.
      // Players who have rested the LEAST should NOT rest again.
      // Players who have rested the MOST... no. 
      // We want FAIR rest. So players who have rested the LEAST should rest now.
      // Wait: restCount[i] = how many times player i has rested.
      // For fairness, players with the LOWEST restCount should rest next.
      // But also consider: if someone hasn't rested at all, they should rest.
      
      // Actually let me reconsider: we want everyone to rest roughly the same number of times.
      // So the players who have rested the FEWEST times should rest this round.
      // allPlayers sorted ascending by restCount → first elements rested least → they should rest
      restingPlayers = allPlayers.slice(0, nbResting);
      activePlayers = allPlayers.slice(nbResting);

      for (const p of restingPlayers) {
        restCount[p]++;
      }
    } else {
      activePlayers = Array.from({ length: nbPlayers }, (_, i) => i);
    }

    // 2. Generate all possible pairs from active players
    const allPairs = combinations(activePlayers, 2);

    // Score each pair
    const scoredPairs = allPairs.map(([a, b]) => ({
      pair: [a, b],
      score: pairScore(a, b, partnerCount),
    }));

    // Sort by partner score ascending (prefer pairs that haven't played together)
    scoredPairs.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return Math.random() - 0.5;
    });

    // 3. Greedy match assignment
    const matches = [];
    const usedInRound = new Set();

    // We need nbCourts matches
    for (let m = 0; m < nbCourts; m++) {
      let bestMatch = null;
      let bestScore = Infinity;

      // Find best team1 pair
      for (let i = 0; i < scoredPairs.length; i++) {
        const [a, b] = scoredPairs[i].pair;
        if (usedInRound.has(a) || usedInRound.has(b)) continue;

        // Find best team2 pair to play against team1
        for (let j = i + 1; j < scoredPairs.length; j++) {
          const [c, d] = scoredPairs[j].pair;
          if (usedInRound.has(c) || usedInRound.has(d)) continue;
          if (a === c || a === d || b === c || b === d) continue;

          const pScore = scoredPairs[i].score + scoredPairs[j].score;
          const oScore = opponentScore([a, b], [c, d], opponentCount);
          const totalScore = pScore * 10 + oScore;

          if (totalScore < bestScore) {
            bestScore = totalScore;
            bestMatch = { team1: [a, b], team2: [c, d], pairIdx: [i, j] };
          }
        }
      }

      if (bestMatch) {
        matches.push(bestMatch);
        for (const p of [...bestMatch.team1, ...bestMatch.team2]) {
          usedInRound.add(p);
        }
      }
    }

    // 4. Assign courts by rotation (players with least courtCount for each court)
    // Simple approach: assign matches to courts, trying to balance court usage
    const courtAssignments = [];
    const availableCourts = Array.from({ length: nbCourts }, (_, i) => i);

    // For each match, find the court where the total courtCount of its players is lowest
    const remainingMatches = [...matches];
    const remainingCourts = [...availableCourts];

    while (remainingMatches.length > 0 && remainingCourts.length > 0) {
      let bestMatchIdx = 0;
      let bestCourtIdx = 0;
      let bestCourtScore = Infinity;

      for (let mi = 0; mi < remainingMatches.length; mi++) {
        const match = remainingMatches[mi];
        const allMatchPlayers = [...match.team1, ...match.team2];

        for (let ci = 0; ci < remainingCourts.length; ci++) {
          const court = remainingCourts[ci];
          const courtScore = allMatchPlayers.reduce((sum, p) => sum + courtCount[p][court], 0);

          if (courtScore < bestCourtScore) {
            bestCourtScore = courtScore;
            bestMatchIdx = mi;
            bestCourtIdx = ci;
          }
        }
      }

      const match = remainingMatches.splice(bestMatchIdx, 1)[0];
      const court = remainingCourts.splice(bestCourtIdx, 1)[0];

      courtAssignments.push({ ...match, court });

      // Update court count
      for (const p of [...match.team1, ...match.team2]) {
        courtCount[p][court]++;
      }
    }

    // 5. Update constraint matrices
    for (const match of courtAssignments) {
      // Partner counts
      partnerCount[match.team1[0]][match.team1[1]]++;
      partnerCount[match.team1[1]][match.team1[0]]++;
      partnerCount[match.team2[0]][match.team2[1]]++;
      partnerCount[match.team2[1]][match.team2[0]]++;

      // Opponent counts
      for (const a of match.team1) {
        for (const b of match.team2) {
          opponentCount[a][b]++;
          opponentCount[b][a]++;
        }
      }

      // Match counts
      for (const p of [...match.team1, ...match.team2]) {
        matchCount[p]++;
      }
    }

    rounds.push({
      roundNumber: r + 1,
      matches: courtAssignments.map((m) => ({
        court: m.court + 1, // 1-indexed for display
        team1: m.team1,
        team2: m.team2,
        score1: null,
        score2: null,
      })),
      resting: restingPlayers,
    });
  }

  return rounds;
}

/**
 * Calculate the recommended number of rounds
 * @param {number} nbPlayers
 * @returns {number}
 */
export function recommendedRounds(nbPlayers) {
  return Math.ceil(nbPlayers / 2) - 1;
}

/**
 * Validate schedule constraints and return stats
 * @param {Array} rounds - generated schedule
 * @param {number} nbPlayers
 * @returns {object} - validation results
 */
export function validateSchedule(rounds, nbPlayers) {
  const partnerCount = createMatrix(nbPlayers);
  const opponentCount = createMatrix(nbPlayers);
  const matchCount = new Array(nbPlayers).fill(0);
  const restCount = new Array(nbPlayers).fill(0);

  for (const round of rounds) {
    for (const match of round.matches) {
      // Count partners
      partnerCount[match.team1[0]][match.team1[1]]++;
      partnerCount[match.team1[1]][match.team1[0]]++;
      partnerCount[match.team2[0]][match.team2[1]]++;
      partnerCount[match.team2[1]][match.team2[0]]++;

      // Count opponents
      for (const a of match.team1) {
        for (const b of match.team2) {
          opponentCount[a][b]++;
          opponentCount[b][a]++;
        }
      }

      // Count matches
      for (const p of [...match.team1, ...match.team2]) {
        matchCount[p]++;
      }
    }

    for (const p of round.resting) {
      restCount[p]++;
    }
  }

  // Find max partner repeat
  let maxPartnerRepeat = 0;
  let partnerRepeats = 0;
  for (let i = 0; i < nbPlayers; i++) {
    for (let j = i + 1; j < nbPlayers; j++) {
      if (partnerCount[i][j] > 1) partnerRepeats++;
      maxPartnerRepeat = Math.max(maxPartnerRepeat, partnerCount[i][j]);
    }
  }

  // Find max opponent repeat
  let maxOpponentRepeat = 0;
  for (let i = 0; i < nbPlayers; i++) {
    for (let j = i + 1; j < nbPlayers; j++) {
      maxOpponentRepeat = Math.max(maxOpponentRepeat, opponentCount[i][j]);
    }
  }

  // Match count fairness
  const minMatches = Math.min(...matchCount);
  const maxMatches = Math.max(...matchCount);

  // Rest count fairness
  const minRest = Math.min(...restCount);
  const maxRest = Math.max(...restCount);

  return {
    maxPartnerRepeat,
    partnerRepeats,
    maxOpponentRepeat,
    matchCount,
    minMatches,
    maxMatches,
    restCount,
    minRest,
    maxRest,
    isValid: maxPartnerRepeat <= 1,
  };
}
