const { test, expect } = require('@playwright/test');

const sizes = [16, 32, 64, 128];

test.describe('Anteraja E2E smoke', () => {
  for (const size of sizes) {
    test(`generate bracket for ${size}`, async ({ page }) => {
      // prepare participants and tournament in localStorage
      const participants = [];
      for (let i = 1; i <= size; i++) {
        participants.push({ id: i, name: `P${i}`, drawingNumber: i, hc: 'HC' });
      }

      // navigate to app origin first so localStorage is accessible, then set data and reload
      await page.goto('/index.html');
      await page.evaluate(({ size, participants }) => {
        localStorage.setItem('anteraja_tournament', JSON.stringify({ size: size, status: 'setup', currentRound: 0 }));
        localStorage.setItem('anteraja_participants', JSON.stringify(participants));
        localStorage.removeItem('anteraja_bracket');
      }, { size, participants });
      await page.reload();

      // ensure UI reflects size
      await page.selectOption('#input-size', String(size));
      await page.click('#btn-generate-bracket');

      // wait for bracket render
      await page.waitForSelector('#bracket-render-area .bracket-wrapper', { timeout: 20000 });

      const content = await page.content();

      // verify every participant appears somewhere in the page
      for (let i = 1; i <= size; i++) {
        expect(content).toContain(`P${i}`);
      }
    });
  }
});