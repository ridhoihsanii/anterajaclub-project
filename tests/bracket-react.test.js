const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const utils = require(path.join(process.cwd(), 'src', 'components', 'bracketUtils.js'));

// ── getHcLabel ──────────────────────────────────────────────────────────────
test('getHcLabel returns preset hc value', () => {
  assert.equal(utils.getHcLabel({ hc: 'HC 3B', hcCustom: '' }), 'HC 3B');
});

test('getHcLabel returns custom hc when hcCustom is set', () => {
  assert.equal(utils.getHcLabel({ hc: 'custom', hcCustom: 'HC 5A' }), 'HC 5A');
});

test('getHcLabel returns hcCustom even when hc is a preset', () => {
  assert.equal(utils.getHcLabel({ hc: 'HC 3N', hcCustom: 'SPECIAL' }), 'SPECIAL');
});

test('getHcLabel returns empty string for null participant', () => {
  assert.equal(utils.getHcLabel(null), '');
});

test('getHcLabel returns empty string when both hc and hcCustom are empty', () => {
  assert.equal(utils.getHcLabel({ hc: '', hcCustom: '' }), '');
});

// ── getParticipantLabel ─────────────────────────────────────────────────────
test('getParticipantLabel formats name and HC', () => {
  assert.equal(utils.getParticipantLabel({ name: 'Ihsan', hc: 'HC 3B', hcCustom: '' }), 'Ihsan - HC 3B');
});

test('getParticipantLabel returns name only when no HC', () => {
  assert.equal(utils.getParticipantLabel({ name: 'Budi', hc: '', hcCustom: '' }), 'Budi');
});

test('getParticipantLabel returns empty string for null', () => {
  assert.equal(utils.getParticipantLabel(null), '');
});

// ── computeMatchMargins ─────────────────────────────────────────────────────
test('computeMatchMargins roundIdx=0 matchIdx=0 returns correct offset', () => {
  // step(0) = (100+8)*1 = 108; offset = 108/2 - 50 = 4
  const { marginTop } = utils.computeMatchMargins(0, 0);
  assert.equal(marginTop, 4);
});

test('computeMatchMargins roundIdx=0 matchIdx=1 returns gap between cards', () => {
  // marginTop for non-first = step - CARD_HEIGHT = 108 - 100 = 8
  const { marginTop } = utils.computeMatchMargins(0, 1);
  assert.equal(marginTop, 8);
});

test('computeMatchMargins roundIdx=1 matchIdx=0 returns correct offset', () => {
  // step(1) = 108*2 = 216; offset = 216/2 - 50 = 58
  const { marginTop } = utils.computeMatchMargins(1, 0);
  assert.equal(marginTop, 58);
});

test('computeMatchMargins roundIdx=1 matchIdx=1 returns gap', () => {
  // step(1) - CARD_HEIGHT = 216 - 100 = 116
  const { marginTop } = utils.computeMatchMargins(1, 1);
  assert.equal(marginTop, 116);
});

// ── computeConnectorHeight ──────────────────────────────────────────────────
test('computeConnectorHeight round 0 is step/2', () => {
  // step(0)=108, connector=54
  assert.equal(utils.computeConnectorHeight(0), 54);
});

test('computeConnectorHeight round 1 is double round 0', () => {
  assert.equal(utils.computeConnectorHeight(1), 108);
});

test('computeConnectorHeight round 2 is quadruple round 0', () => {
  assert.equal(utils.computeConnectorHeight(2), 216);
});

// ── resolveWinner ──────────────────────────────────────────────────────────
test('resolveWinner returns p1 when score1 > score2', () => {
  const p1 = { id: 'a', name: 'Alice' };
  const p2 = { id: 'b', name: 'Bob' };
  const winner = utils.resolveWinner({ p1, p2, score1: 7, score2: 5 });
  assert.equal(winner, p1);
});

test('resolveWinner returns p2 when score2 > score1', () => {
  const p1 = { id: 'a', name: 'Alice' };
  const p2 = { id: 'b', name: 'Bob' };
  const winner = utils.resolveWinner({ p1, p2, score1: 3, score2: 9 });
  assert.equal(winner, p2);
});

test('resolveWinner returns null when scores are equal', () => {
  const p1 = { id: 'a', name: 'Alice' };
  const p2 = { id: 'b', name: 'Bob' };
  assert.equal(utils.resolveWinner({ p1, p2, score1: 5, score2: 5 }), null);
});

test('resolveWinner returns null when score1 is empty string', () => {
  const p1 = { id: 'a', name: 'Alice' };
  const p2 = { id: 'b', name: 'Bob' };
  assert.equal(utils.resolveWinner({ p1, p2, score1: '', score2: 5 }), null);
});

test('resolveWinner returns null when score2 is null', () => {
  const p1 = { id: 'a', name: 'Alice' };
  const p2 = { id: 'b', name: 'Bob' };
  assert.equal(utils.resolveWinner({ p1, p2, score1: 5, score2: null }), null);
});

test('resolveWinner returns null for null match', () => {
  assert.equal(utils.resolveWinner(null), null);
});
