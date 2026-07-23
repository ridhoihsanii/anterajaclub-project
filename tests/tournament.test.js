const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadTournament() {
  const context = {
    window: {},
    console: console
  };
  const tournamentPath = path.join(process.cwd(), 'assets', 'js', 'tournament.js');
  const source = fs.readFileSync(tournamentPath, 'utf8');

  vm.createContext(context);
  vm.runInContext(source, context);

  return context.window.AnterajaTournament;
}

test('autoAdvanceByes resolves cascading double-BYE matches in later rounds', () => {
  const AnterajaTournament = loadTournament();
  const bye = function (drawingNumber) {
    return { id: null, name: 'BYE', hc: '', drawingNumber: drawingNumber };
  };
  const bracket = {
    rounds: [
      [
        { id: 'r0m0', p1: bye(1), p2: bye(2), score1: '', score2: '', winner: null, status: 'pending' },
        { id: 'r0m1', p1: bye(3), p2: bye(4), score1: '', score2: '', winner: null, status: 'pending' }
      ],
      [
        { id: 'r1m0', p1: null, p2: null, score1: '', score2: '', winner: null, status: 'pending' }
      ],
      [
        { id: 'r2m0', p1: null, p2: null, score1: '', score2: '', winner: null, status: 'pending' }
      ]
    ]
  };

  AnterajaTournament.autoAdvanceByes(bracket);

  assert.equal(bracket.rounds[1][0].status, 'done');
  assert.equal(bracket.rounds[1][0].p1.name, 'BYE');
  assert.equal(bracket.rounds[1][0].p2.name, 'BYE');
  assert.equal(bracket.rounds[2][0].p1.name, 'BYE');
});
