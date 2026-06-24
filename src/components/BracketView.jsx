import React, { useMemo } from 'react';
import RoundColumn from './RoundColumn';

export default function BracketView({
  bracket, participants, liveMatchId,
  onScoreChange, onSelectParticipant, onToggleLive,
}) {
  var rounds      = bracket.rounds;
  var totalRounds = rounds.length;

  // Set of participant IDs already used in Round 1 (for duplicate prevention)
  var usedInRound1 = useMemo(function() {
    var used = new Set();
    if (!rounds[0]) return used;
    rounds[0].forEach(function(m) {
      if (m.p1 && m.p1.id != null) used.add(String(m.p1.id));
      if (m.p2 && m.p2.id != null) used.add(String(m.p2.id));
    });
    return used;
  }, [rounds]);

  return (
    <div className="bracket-view">
      {rounds.map(function(round, roundIdx) {
        return (
          <RoundColumn
            key={roundIdx}
            round={round}
            roundIdx={roundIdx}
            totalRounds={totalRounds}
            participants={participants}
            usedInRound1={usedInRound1}
            liveMatchId={liveMatchId}
            onScoreChange={onScoreChange}
            onSelectParticipant={onSelectParticipant}
            onToggleLive={onToggleLive}
          />
        );
      })}
    </div>
  );
}
