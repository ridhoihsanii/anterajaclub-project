(function () {
  function toNumber(value) {
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function isBye(participant) {
    return !participant || participant.name === 'BYE';
  }

  function cloneParticipant(participant, drawingNumber) {
    if (!participant) {
      return {
        id: null,
        name: 'BYE',
        hc: '',
        drawingNumber: drawingNumber
      };
    }

    return {
      id: participant.id,
      name: participant.name,
      hc: participant.hc,
      drawingNumber: drawingNumber
    };
  }

  function createMatch(id, p1, p2) {
    return {
      id: id,
      p1: p1 || null,
      p2: p2 || null,
      score1: '',
      score2: '',
      winner: null,
      status: 'pending'
    };
  }

  function compareDrawingNumber(left, right) {
    var leftNumber = toNumber(left && left.drawingNumber);
    var rightNumber = toNumber(right && right.drawingNumber);
    var leftHasDrawing = leftNumber != null;
    var rightHasDrawing = rightNumber != null;

    if (!leftHasDrawing && !rightHasDrawing) {
      return 0;
    }

    if (!leftHasDrawing) {
      return 1;
    }

    if (!rightHasDrawing) {
      return -1;
    }

    return leftNumber - rightNumber;
  }

  function matchesParticipantId(candidate, participantId) {
    return candidate && candidate.id != null && String(candidate.id) === String(participantId);
  }

  var AnterajaTournament = {
    calcRounds: function (size) {
      var normalizedSize = toNumber(size);

      if (normalizedSize == null || normalizedSize <= 0) {
        return 0;
      }

      return Math.ceil(Math.log2(normalizedSize));
    },

    calcMatches: function (size) {
      var normalizedSize = toNumber(size);

      if (normalizedSize == null || normalizedSize <= 0) {
        return 0;
      }

      return normalizedSize - 1;
    },

    getRoundLabel: function (roundIndex, totalRounds) {
      var fromEnd = Number(totalRounds) - 1 - Number(roundIndex);

      if (fromEnd === 0) {
        return 'FINAL';
      }

      if (fromEnd === 1) {
        return 'SEMI FINAL';
      }

      if (fromEnd === 2) {
        return 'QUARTER FINAL';
      }

      return 'ROUND ' + (Number(roundIndex) + 1);
    },

    generateBracket: function (size, participants) {
      if (!size || size < 2) {
        return { rounds: [], size: 0, generatedAt: Date.now() };
      }

      size = Math.max(2, parseInt(size, 10));

      var normalizedSize = Number(size) > 0 ? Number(size) : 0;
      var list = Array.isArray(participants) ? participants.slice() : [];
      var sortedParticipants = list.sort(compareDrawingNumber);
      var slots = [];
      var rounds = [];
      var i;
      var j;
      var previousRoundLength;

      for (i = 1; i <= normalizedSize; i += 1) {
        var participant = null;

        for (j = 0; j < sortedParticipants.length; j += 1) {
          if (toNumber(sortedParticipants[j] && sortedParticipants[j].drawingNumber) === i) {
            participant = sortedParticipants[j];
            break;
          }
        }

        slots.push(cloneParticipant(participant, i));
      }

      var firstRound = [];

      for (i = 0; i < slots.length; i += 2) {
        firstRound.push(createMatch(
          'r0m' + firstRound.length,
          slots[i] || null,
          slots[i + 1] || null
        ));
      }

      rounds.push(firstRound);
      previousRoundLength = firstRound.length;

      for (i = 1; i < this.calcRounds(normalizedSize); i += 1) {
        var round = [];
        var matchCount = Math.ceil(previousRoundLength / 2);

        for (j = 0; j < matchCount; j += 1) {
          round.push(createMatch('r' + i + 'm' + j, null, null));
        }

        rounds.push(round);
        previousRoundLength = round.length;
      }

      return {
        rounds: rounds,
        size: normalizedSize,
        generatedAt: Date.now()
      };
    },

    advanceWinner: function (bracket, roundIdx, matchIdx, winner) {
      if (!bracket || !Array.isArray(bracket.rounds)) {
        return bracket;
      }

      var nextRound = bracket.rounds[roundIdx + 1];
      var nextMatchIdx;
      var slot;

      if (!nextRound || !nextRound.length) {
        return bracket;
      }

      nextMatchIdx = Math.floor(matchIdx / 2);
      slot = matchIdx % 2 === 0 ? 'p1' : 'p2';

      if (nextRound[nextMatchIdx]) {
        nextRound[nextMatchIdx][slot] = winner || null;
      }

      return bracket;
    },

    autoAdvanceByes: function (bracket) {
      if (!bracket || !bracket.rounds) return bracket;
      
      var changed = true;
      var maxPasses = bracket.rounds.length + 1;
      var pass = 0;
      
      while (changed && pass < maxPasses) {
        changed = false;
        pass++;
        
        bracket.rounds.forEach(function (round, roundIdx) {
          round.forEach(function (match, matchIdx) {
            if (match.status === 'done') return;
            
            var p1IsBye = match.p1 && match.p1.name === 'BYE';
            var p2IsBye = match.p2 && match.p2.name === 'BYE';
            var p1IsNull = !match.p1;
            var p2IsNull = !match.p2;
            
            if (p1IsBye && p2IsBye) {
              match.status = 'done';
              match.winner = null;
              var byeAdvance = { id: null, name: 'BYE', hc: '', drawingNumber: null };
              AnterajaTournament.advanceWinner(bracket, roundIdx, matchIdx, byeAdvance);
              changed = true;
            } else if (p1IsBye && match.p2 && match.p2.name !== 'BYE') {
              match.winner = match.p2;
              match.status = 'done';
              AnterajaTournament.advanceWinner(bracket, roundIdx, matchIdx, match.p2);
              changed = true;
            } else if (p2IsBye && match.p1 && match.p1.name !== 'BYE') {
              match.winner = match.p1;
              match.status = 'done';
              AnterajaTournament.advanceWinner(bracket, roundIdx, matchIdx, match.p1);
              changed = true;
            }
          });
        });
      }
      
      return bracket;
    },

    getStats: function (participants, bracket) {
      var realParticipants = (Array.isArray(participants) ? participants : []).filter(function (p) {
        return p && p.name && p.name !== 'BYE';
      });
      var total = realParticipants.length;
      var cash = realParticipants.filter(function (p) {
        return p.status === 'cash';
      }).length;
      var tf = realParticipants.filter(function (p) {
        return p.status === 'tf';
      }).length;
      var unpaid = total - cash - tf;
      var tournamentSize = bracket ? bracket.size : 0;
      var totalMatches = tournamentSize > 0 ? tournamentSize - 1 : 0;
      var finished = 0;

      if (bracket && bracket.rounds) {
        bracket.rounds.forEach(function (round) {
          round.forEach(function (match) {
            if (match.status === 'done' && match.winner && match.winner.name !== 'BYE') {
              finished += 1;
            }
          });
        });
      }

      return {
        total: total,
        cash: cash,
        tf: tf,
        unpaid: unpaid,
        totalMatches: totalMatches,
        finished: finished,
        remaining: totalMatches - finished
      };
    },

    syncParticipantInBracket: function (bracket, participantId, name, hc) {
      var i;
      var j;

      if (bracket == null) {
        return null;
      }

      if (!Array.isArray(bracket.rounds)) {
        return bracket;
      }

      for (i = 0; i < bracket.rounds.length; i += 1) {
        var round = bracket.rounds[i];

        if (!Array.isArray(round)) {
          continue;
        }

        for (j = 0; j < round.length; j += 1) {
          var match = round[j];

          if (!match) {
            continue;
          }

          if (matchesParticipantId(match.p1, participantId)) {
            match.p1.name = name;
            match.p1.hc = hc;
          }

          if (matchesParticipantId(match.p2, participantId)) {
            match.p2.name = name;
            match.p2.hc = hc;
          }

          if (matchesParticipantId(match.winner, participantId)) {
            match.winner.name = name;
            match.winner.hc = hc;
          }
        }
      }

      return bracket;
    }
  };

  if (typeof window !== 'undefined') {
    window.AnterajaTournament = AnterajaTournament;
  }
})();
