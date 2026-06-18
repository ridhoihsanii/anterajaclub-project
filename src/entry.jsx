import React from 'react';
import { createRoot } from 'react-dom/client';
import Bracket from './components/Bracket';

function mount() {
  const participants = (window.BilposStorage && window.BilposStorage.loadParticipants()) || [];
  const rootEl = document.getElementById('bracket-react-root');
  if (!rootEl) return;
  try {
    const root = createRoot(rootEl);
    root.render(<Bracket participants={participants} />);
  } catch (err) {
    console.error('Failed to mount Bracket', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
