// Example Express route: server/routes/bracket.js
// Note: adapt db calls to your project's DB helper (this is pseudo-code).

const express = require('express');
const router = express.Router();
const db = require('../../db'); // adjust path to your db helper

// PATCH /server/routes/bracket/matches/:id
router.patch('/matches/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { slot1Score, slot2Score, live, startTime, slot1Id, slot2Id } = req.body;

    await db.query(`UPDATE matches SET slot1Score=?, slot2Score=?, live=?, startTime=?, slot1Id=?, slot2Id=? WHERE id=?`, [
      slot1Score ?? null,
      slot2Score ?? null,
      live ? 1 : 0,
      startTime || null,
      slot1Id || null,
      slot2Id || null,
      id,
    ]);

    const m = await db.one('SELECT * FROM matches WHERE id=?', [id]);

    if (m.slot1Score != null && m.slot2Score != null && m.slot1Score !== m.slot2Score) {
      const winnerId = m.slot1Score > m.slot2Score ? m.slot1Id : m.slot2Id;
      // compute dynamic parent using total matches in DB
      const cntRow = await db.one('SELECT COUNT(*) AS cnt FROM matches');
      const totalMatches = Number(cntRow.cnt ?? cntRow.COUNT ?? cntRow.count ?? 0);
      const totalSlots = totalMatches + 1;
      const rounds = Math.round(Math.log2(totalSlots));
      const matchesPerRound = Array.from({ length: rounds }, (_, r) => totalSlots / Math.pow(2, r + 1));
      const roundBases = [];
      let acc = 0;
      for (let r = 0; r < matchesPerRound.length; r++) {
        roundBases.push(acc);
        acc += matchesPerRound[r];
      }

      // find round of current match
      let roundIdx = null;
      for (let r = 0; r < roundBases.length; r++) {
        const base = roundBases[r];
        const size = matchesPerRound[r];
        if (m.id >= base && m.id < base + size) { roundIdx = r; break; }
      }
      if (roundIdx !== null) {
        const nextRound = roundIdx + 1;
        if (nextRound < roundBases.length) {
          const parent = roundBases[nextRound] + Math.floor((m.id - roundBases[roundIdx]) / 2);
          const parentRow = await db.one('SELECT * FROM matches WHERE id=?', [parent]);
          if (!parentRow.slot1Id) await db.query('UPDATE matches SET slot1Id=? WHERE id=?', [winnerId, parent]);
          else if (!parentRow.slot2Id) await db.query('UPDATE matches SET slot2Id=? WHERE id=?', [winnerId, parent]);
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

module.exports = router;
