// src/components/bracketUtils.js
// Pure logic utilities for the React bracket module.
// Uses CommonJS exports so Node.js tests can require() directly.

const CARD_HEIGHT = 100;
const CARD_GAP    = 8;
const ROUND_GAP   = 48;
const ARM_LENGTH  = 24; // = ROUND_GAP / 2

function getHcLabel(p) {
  if (!p) return '';
  const custom = String(p.hcCustom || '').trim();
  const hc     = String(p.hc     || '').trim();
  if (hc === 'custom' || custom) return custom || hc;
  return hc;
}

function getParticipantLabel(p) {
  if (!p || !p.name) return '';
  const hc = getHcLabel(p);
  return hc ? p.name + ' - ' + hc : p.name;
}

// Returns { marginTop: number } – apply as inline style on .match-wrapper
function computeMatchMargins(roundIdx, matchIdx) {
  var step   = (CARD_HEIGHT + CARD_GAP) * Math.pow(2, roundIdx);
  var offset = step / 2 - CARD_HEIGHT / 2;
  return { marginTop: matchIdx === 0 ? offset : step - CARD_HEIGHT };
}

// Returns the height in px of the vertical connector pseudo-element
function computeConnectorHeight(roundIdx) {
  var step = (CARD_HEIGHT + CARD_GAP) * Math.pow(2, roundIdx);
  return step / 2;
}

// Returns the winning participant or null
// Null if either score is empty/null, or if scores are equal
function resolveWinner(match) {
  if (!match) return null;
  var s1 = match.score1;
  var s2 = match.score2;
  if (s1 === '' || s1 == null || s2 === '' || s2 == null) return null;
  var n1 = Number(s1);
  var n2 = Number(s2);
  if (n1 === n2) return null;
  return n1 > n2 ? match.p1 : match.p2;
}

module.exports = {
  CARD_HEIGHT,
  CARD_GAP,
  ROUND_GAP,
  ARM_LENGTH,
  getHcLabel,
  getParticipantLabel,
  computeMatchMargins,
  computeConnectorHeight,
  resolveWinner,
};
