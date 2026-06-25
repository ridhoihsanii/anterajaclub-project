# Task 1: Dispatch event saat ukuran tournament berubah

**Files:**
- Modify: `assets/js/app.js` (sekitar baris 258-267, `input-size` change handler)
- Test: `tests/app-events.test.js`

**Interfaces:**
- Produces: `window.dispatchEvent` dipanggil dengan event bertipe `'bilpos:bracket-activated'` setiap kali `input-size` di-change

---

- [ ] **Step 1: Upgrade fake window di `loadApp` untuk tracking events**

Di `tests/app-events.test.js`, ubah fungsi `loadApp` (sekitar baris 197-277). Tambahkan `dispatchedEvents`, `window.dispatchEvent`, dan `CustomEvent` ke context. Perubahan ada di dalam blok `loadApp`:

```js
function loadApp(options) {
  const document = new FakeDocument();
  const window = { document: document };
  const config = options || {};
  const toastCalls = [];
  const savedParticipantsCalls = [];
  const savedBracketCalls = [];
  const dispatchedEvents = [];           // TAMBAH INI
  let participants = config.participants ? config.participants.slice() : [];

  // Tambahkan addEventListener dan dispatchEvent ke fake window:
  window.addEventListener = function(eventName, handler) {};  // no-op untuk test
  window.dispatchEvent = function(event) {                    // TAMBAH INI
    dispatchedEvents.push(event && event.type ? event.type : String(event));
  };

  const context = {
    window: window,
    document: document,
    console: console,
    CustomEvent: function(type) { return { type: type }; },  // TAMBAH INI
    BilposStorage: {
      loadTournament: function () {
        return { size: 2, venue: '', status: '' };
      },
      loadParticipants: function () {
        return participants;
      },
      loadBracket: function () {
        return config.bracket || null;
      },
      loadSettings: function () {
        return { zoom: 100 };
      },
      saveTournament: function(data) {},                      // TAMBAH INI (agar tidak throw)
      saveParticipants: function (nextParticipants) {
        participants = nextParticipants;
        savedParticipantsCalls.push(nextParticipants);
      },
      saveBracket: function (bracket) {
        savedBracketCalls.push(bracket);
      }
    },
    BilposDrawing: {
      drawSlot: config.drawSlot || function () {
        return null;
      }
    },
    BilposTournament: {
      advanceWinner: config.advanceWinner || function (bracket, roundIdx, matchIdx, winner) {
        return {
          bracket: bracket,
          roundIdx: roundIdx,
          matchIdx: matchIdx,
          winner: winner
        };
      }
    },
    BilposUI: {
      showToast: function (message, type) {
        toastCalls.push({ message: message, type: type });
      },
      updateHeader: function() {}                             // TAMBAH INI
    }
  };

  window.BilposStorage = context.BilposStorage;
  window.BilposDrawing = context.BilposDrawing;
  window.BilposTournament = context.BilposTournament;
  window.BilposUI = context.BilposUI;

  const appPath = path.join(process.cwd(), 'assets', 'js', 'app.js');
  const source = fs.readFileSync(appPath, 'utf8');
  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    BilposApp: context.window.BilposApp,
    document: document,
    window: window,
    toastCalls: toastCalls,
    dispatchedEvents: dispatchedEvents,                      // EXPOSE INI
    getSavedParticipantsCalls: function () {
      return savedParticipantsCalls;
    },
    getSavedBracketCalls: function () {
      return savedBracketCalls;
    },
    getParticipants: function () {
      return participants;
    }
  };
}
```

- [ ] **Step 2: Tulis failing test untuk size-change dispatch**

Tambahkan test berikut di bagian bawah `tests/app-events.test.js`:

```js
test('size change dispatches bilpos:bracket-activated event', () => {
  const loaded = loadApp();
  const app = loaded.BilposApp;

  app.tournament = { size: 32, fee: 0 };
  app.renderParticipantTable = function() {};
  app.renderStats = function() {};

  appendElement(loaded.document, 'input', { id: 'input-size', value: '16' });

  app.wireEvents();

  const sizeInput = loaded.document.getElementById('input-size');
  sizeInput.value = '16';
  sizeInput.dispatchEvent('change', { target: sizeInput });

  assert.ok(
    loaded.dispatchedEvents.includes('bilpos:bracket-activated'),
    'Expected bilpos:bracket-activated to be dispatched when size changes'
  );
});
```

- [ ] **Step 3: Jalankan test untuk verifikasi FAIL**

```
node --test tests/app-events.test.js
```

Expected: Test baru FAIL dengan pesan `Expected bilpos:bracket-activated to be dispatched when size changes`

- [ ] **Step 4: Implementasi — tambah helper function dan dispatch di `input-size` handler**

Di `assets/js/app.js`, tambahkan helper `dispatchBracketActivated` di dalam IIFE (setelah `getElement` function, sekitar baris 11-16):

```js
  function dispatchBracketActivated() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      var event = typeof CustomEvent === 'function'
        ? new CustomEvent('bilpos:bracket-activated')
        : { type: 'bilpos:bracket-activated' };
      window.dispatchEvent(event);
    }
  }
```

Ubah handler `input-size` (baris 258-267), tambah satu baris dispatch:

```js
      var inputSize = getElement('input-size');
      if (inputSize) {
        inputSize.addEventListener('change', function (e) {
          var size = parseInt(e.target.value, 10);
          self.tournament.size = size;
          BilposStorage.saveTournament(self.tournament);
          dispatchBracketActivated();
          self.renderParticipantTable();
          self.renderStats();
        });
      }
```

- [ ] **Step 5: Jalankan test untuk verifikasi PASS**

```
node --test tests/app-events.test.js
```

Expected output (test baru PASS):
```
? size change dispatches bilpos:bracket-activated event
```

- [ ] **Step 6: Commit**

```bash
git add assets/js/app.js tests/app-events.test.js
git commit -m "fix: dispatch bilpos:bracket-activated when tournament size changes"
```
