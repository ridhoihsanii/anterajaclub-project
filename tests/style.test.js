const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readStyleSheet() {
  const stylesheetPath = path.join(process.cwd(), 'assets', 'css', 'style.css');
  assert.ok(fs.existsSync(stylesheetPath), 'assets/css/style.css should exist');
  return fs.readFileSync(stylesheetPath, 'utf8');
}

test('style.css defines the Anteraja premium design tokens', () => {
  const source = readStyleSheet();

  [
    '--anteraja-primary: #ED0677;',
    '--anteraja-secondary: #FFCB05;',
    '--anteraja-charcoal: #3B2C2F;',
    '--anteraja-surface-2: #34262A;',
    '--shadow-brand: 0 0 20px rgba(237,6,119,0.25);',
    '--transition: all 0.25s cubic-bezier(0.4,0,0.2,1);'
  ].forEach((token) => {
    assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

test('style.css includes premium layout, component, and responsive sections', () => {
  const source = readStyleSheet();

  [
    '.anteraja-header',
    '.anteraja-sidebar',
    '.anteraja-main',
    '.anteraja-card',
    '.stat-card',
    '.btn-anteraja-primary',
    '.participant-table',
    '.bracket-container',
    '.match-card.match-live',
    '#toast-container',
    '.anteraja-form-group',
    '.empty-state',
    '.skeleton-row',
    '.ripple',
    '.anteraja-footer',
    '.export-btn-group',
    '.settings-item',
    '.bracket-container:fullscreen',
    '@media (max-width: 991.98px)',
    '@media (max-width: 575.98px)'
  ].forEach((selector) => {
    assert.match(source, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

test('style.css includes required interactive and animation details', () => {
  const source = readStyleSheet();

  [
    'backdrop-filter: blur(20px);',
    'background: linear-gradient(135deg, var(--anteraja-primary) 0%, var(--anteraja-primary-dark) 100%);',
    'box-shadow: var(--shadow-brand);',
    'position: sticky;',
    'animation: livePulse 2s ease-in-out infinite;',
    '@keyframes fadeIn',
    '@keyframes rippleAnim',
    '@keyframes livePulse',
    '@keyframes heartbeat',
    '@keyframes glow'
  ].forEach((snippet) => {
    assert.match(source, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});
