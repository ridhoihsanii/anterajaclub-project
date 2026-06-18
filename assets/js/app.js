(function () {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getElement(id) {
    if (typeof document === 'undefined' || !document.getElementById) {
      return null;
    }

    return document.getElementById(id);
  }

  function getKnownHcValue(participant) {
    var hcValues = ['HC 3B', 'HC 3N', 'HC 3A', 'HC 3+', 'custom'];
    var hc = participant && participant.hc != null ? String(participant.hc) : '';
    var hcCustom = participant && participant.hcCustom != null ? String(participant.hcCustom) : '';

    if (hc === 'custom' || hcCustom) {
      return 'custom';
    }

    if (hcValues.indexOf(hc) !== -1) {
      return hc;
    }

    return hc ? 'custom' : '';
  }

  function getCustomHcValue(participant) {
    if (!participant) {
      return '';
    }

    if (participant.hcCustom != null && String(participant.hcCustom).trim()) {
      return String(participant.hcCustom).trim();
    }

    if (participant.hc && ['HC 3B', 'HC 3N', 'HC 3A', 'HC 3+', 'custom'].indexOf(String(participant.hc)) === -1) {
      return String(participant.hc);
    }

    return '';
  }

  function hasMeaningfulParticipantData(participant) {
    if (!participant) {
      return false;
    }

    return !!(
      String(participant.phone || '').trim() ||
      String(participant.name || '').trim() ||
      String(participant.hc || '').trim() ||
      String(participant.hcCustom || '').trim() ||
      String(participant.status || '').trim() ||
      participant.drawingNumber != null
    );
  }

  function sortByName(list, order) {
    return list.sort(function (left, right) {
      var leftName = String(left && left.name ? left.name : '').trim().toLowerCase();
      var rightName = String(right && right.name ? right.name : '').trim().toLowerCase();
      var leftPhone = String(left && left.phone ? left.phone : '').trim().toLowerCase();
      var rightPhone = String(right && right.phone ? right.phone : '').trim().toLowerCase();
      var direction = order === 'za' ? -1 : 1;

      if (!leftName && rightName) {
        return 1;
      }

      if (leftName && !rightName) {
        return -1;
      }

      if (leftName < rightName) {
        return -1 * direction;
      }

      if (leftName > rightName) {
        return 1 * direction;
      }

      if (leftPhone < rightPhone) {
        return -1 * direction;
      }

      if (leftPhone > rightPhone) {
        return 1 * direction;
      }

      return Number(left._sourceRow || 0) - Number(right._sourceRow || 0);
    });
  }

  var BilposApp = {
    tournament: null,
    participants: [],
    bracket: null,
    settings: null,
    sortOrder: 'default',
    _eventsWired: false,

    init: function () {
      if (typeof BilposStorage === 'undefined') {
        return;
      }

      this.tournament = BilposStorage.loadTournament();
      this.participants = BilposStorage.loadParticipants();
      this.bracket = BilposStorage.loadBracket();
      this.settings = BilposStorage.loadSettings();
      this.sortOrder = 'default';
      this.renderTournamentSetup();
      this.renderParticipantTable();
      this.renderBracket();
      this.renderStats();
      this.wireEvents();
      // Single-page layout: show all sections stacked. Do not switch nav.
      document.querySelectorAll('.bilpos-section').forEach(function (s) { s.style.display = ''; if (s.classList) s.classList.add('active'); });
      BilposUI.updateHeader(this.tournament);
      // initialize top taskbar active state
      try { var navDefault = document.querySelector('.sidebar-nav-item[data-section="dashboard"]'); if (navDefault) navDefault.classList.add('active'); } catch (err) {}

      var savedZoom = this.settings && this.settings.zoom ? this.settings.zoom : 100;
      // ensure savedZoom within new bounds (65-100)
      if (savedZoom < 65) savedZoom = 65;
      if (savedZoom > 100) savedZoom = 100;
      // wire new slider if present
      var zoomRangeEl = getElement('zoom-range');
      var zoomValueEl = getElement('zoom-value');
      if (zoomRangeEl) {
        zoomRangeEl.value = String(savedZoom);
        if (zoomValueEl) {
          // map slider 65-100 -> display 0-100
          var displayPct = Math.round((savedZoom - 65) / 35 * 100);
          zoomValueEl.textContent = String(displayPct) + '%';
        }
      }
      BilposBracket.setZoom(savedZoom);
    },

    renderTournamentSetup: function () {
      var sizeInput = getElement('input-size');
      var infoRounds = getElement('info-rounds');
      var infoMatches = getElement('info-matches');
      var infoStatus = getElement('info-status');
      var tournament = this.tournament || BilposStorage.loadTournament();
      var size = parseInt(tournament.size, 10) || 32;

      var feeInput = getElement('input-fee');
      if (feeInput) {
        feeInput.value = typeof tournament.fee !== 'undefined' && tournament.fee !== null ? tournament.fee : '';
      }

      if (sizeInput) {
        sizeInput.value = String(size);
      }

      if (infoRounds) {
        infoRounds.textContent = BilposTournament.calcRounds(size);
      }

      if (infoMatches) {
        infoMatches.textContent = BilposTournament.calcMatches(size);
      }

      if (infoStatus) {
        infoStatus.textContent = tournament.status || '';
      }
    },

    getParticipantsForTable: function () {
      var size = parseInt(this.tournament && this.tournament.size, 10) || 32;
      var slotMap = {};
      var slotless = [];
      var ordered = [];
      var participants = Array.isArray(this.participants) ? this.participants.slice() : [];
      var i;

      for (i = 0; i < participants.length; i += 1) {
        if (participants[i] && Number(participants[i].slot) >= 1) {
          slotMap[Number(participants[i].slot)] = participants[i];
        } else {
          slotless.push(participants[i]);
        }
      }

      for (i = 1; i <= size; i += 1) {
        ordered.push(slotMap[i] || slotless[i - 1] || null);
      }

      if (this.sortOrder === 'az' || this.sortOrder === 'za') {
        ordered = sortByName(ordered.slice(), this.sortOrder);
      }

      return ordered;
    },

    renderParticipantTable: function () {
      var tbody = getElement('participant-tbody');
      var size = parseInt(this.tournament && this.tournament.size, 10) || 32;
      var rows = [];
      var participants = this.getParticipantsForTable();
      var i;

      if (!tbody) {
        return;
      }

      for (i = 1; i <= size; i += 1) {
        var participant = participants[i - 1] || null;
        var phone = participant && participant.phone ? participant.phone : '';
        var name = participant && participant.name ? participant.name : '';
        var hcValue = getKnownHcValue(participant);
        var hcCustom = getCustomHcValue(participant);
        var drawingNumber = participant && participant.drawingNumber != null ? participant.drawingNumber : '';
        var status = participant && participant.status ? participant.status : '';
        var rowClass = status === 'cash' ? 'row-paid-cash' : (status === 'tf' ? 'row-paid-tf' : '');
        var cashActive = status === 'cash' ? 'active' : '';
        var tfActive = status === 'tf' ? 'active' : '';
        var customVisible = hcValue === 'custom' ? 'visible' : '';

        rows.push(
          '<tr id="row-' + i + '" data-row="' + i + '" data-current-status="' + escapeHtml(status) + '" class="' + rowClass + '">' +
            '<td class="row-number">' + i + '</td>' +
            '<td>' +
              '<div class="d-flex gap-1">' +
                '<button class="status-btn cash ' + cashActive + '" data-row="' + i + '" data-status="cash">' +
                  '<i class="fas fa-money-bill"></i> CASH' +
                '</button>' +
                '<button class="status-btn tf ' + tfActive + '" data-row="' + i + '" data-status="tf">' +
                  '<i class="fas fa-exchange-alt"></i> TF' +
                '</button>' +
              '</div>' +
            '</td>' +
            '<td>' +
              '<input type="text" class="table-input name-input" data-row="' + i + '" placeholder="Nama peserta..." value="' + escapeHtml(name) + '" maxlength="40"/>' +
            '</td>' +
            '<td>' +
              '<select class="table-select hc-select" data-row="' + i + '">' +
                '<option value="">— HC —</option>' +
                '<option value="HC 3B"' + (hcValue === 'HC 3B' ? ' selected' : '') + '>HC 3B</option>' +
                '<option value="HC 3N"' + (hcValue === 'HC 3N' ? ' selected' : '') + '>HC 3N</option>' +
                '<option value="HC 3A"' + (hcValue === 'HC 3A' ? ' selected' : '') + '>HC 3A</option>' +
                '<option value="HC 3+"' + (hcValue === 'HC 3+' ? ' selected' : '') + '>HC 3+</option>' +
                '<option value="custom"' + (hcValue === 'custom' ? ' selected' : '') + '>Custom HC</option>' +
              '</select>' +
              '<input type="text" class="hc-custom-input ' + customVisible + '" data-row="' + i + '" placeholder="Tulis HC..." value="' + escapeHtml(hcCustom) + '" maxlength="20"/>' +
            '</td>' +
            '<td>' +
              '<button class="btn-delete-row btn-export" data-row="' + i + '"><i class="fas fa-trash"></i></button>' +
            '</td>' +
          '</tr>'
        );
      }

      tbody.innerHTML = rows.join('');

      for (i = 1; i <= size; i += 1) {
        var customInput = document.querySelector('.hc-custom-input[data-row="' + i + '"]');
        if (customInput && !customInput.classList.contains('visible')) {
          customInput.style.display = 'none';
        }
      }
    },

    renderBracket: function () {
      var container = getElement('bracket-render-area');
      if (!container) return;
      BilposBracket.render(this.bracket, container);
      BilposBracket.setZoom(this.settings.zoom || 100);
      // populate selects after render
      this.populateBracketSelects();
      // center final column for better visual
      BilposBracket.centerFinal(container);
    },

    populateBracketSelects: function () {
      var self = this;
      var participants = Array.isArray(this.participants) ? this.participants.slice() : [];
      var assigned = {};

      // collect currently assigned participant ids in bracket
      if (this.bracket && Array.isArray(this.bracket.rounds)) {
        this.bracket.rounds.forEach(function (round) {
          round.forEach(function (match) {
            if (!match) return;
            ['p1','p2'].forEach(function (k) {
              var p = match[k];
              if (p && p.id) assigned[p.id] = true;
            });
          });
        });
      }

      // For each select, populate options excluding assigned participants except current value
      document.querySelectorAll('.bracket-select').forEach(function (sel) {
        var r = sel.dataset.round ? parseInt(sel.dataset.round,10) : 0;
        var m = sel.dataset.match ? parseInt(sel.dataset.match,10) : 0;
        var pnum = sel.dataset.player ? parseInt(sel.dataset.player,10) : 1;
        // get current assigned id for this slot if any
        var currentId = '';
        try {
          var match = (self.bracket.rounds[r] && self.bracket.rounds[r][m]) || null;
          var key = pnum === 1 ? 'p1' : 'p2';
          if (match && match[key] && match[key].id) currentId = match[key].id;
        } catch (err) { currentId = ''; }

        // build feeder set: include participant ids coming from previous round matches feeding this slot
        var feederIds = {};
        try {
          if (r > 0 && self.bracket && Array.isArray(self.bracket.rounds)) {
            var prev = self.bracket.rounds[r-1] || [];
            var feederA = prev[m*2] || null;
            var feederB = prev[m*2+1] || null;
            [feederA, feederB].forEach(function(fe) {
              if (!fe) return;
              ['p1','p2'].forEach(function(k){
                try {
                  if (fe[k] && fe[k].id) feederIds[fe[k].id] = true;
                } catch(e) {}
              });
            });
          }
        } catch(e) {}

        // build options
        sel.innerHTML = '';
        var emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = ''; sel.appendChild(emptyOpt);

        participants.forEach(function (pt) {
          if (!pt || !pt.id) return;
          // allow participant if not assigned elsewhere OR if it's the current value OR if it's a feeder for this select
          if (assigned[pt.id] && pt.id !== currentId && !feederIds[pt.id]) return;
          var opt = document.createElement('option');
          opt.value = pt.id;
          // show only name in dropdown; HC will be displayed as badge in card
          opt.textContent = (pt.name || '');
          if (pt.hc) opt.dataset.hc = pt.hc;
          if (pt.id === currentId) opt.selected = true;
          sel.appendChild(opt);
        });

        // Additionally, if round > 0 and feeders exist but their entries are not in participants (rare), include their names explicitly
        try {
          if (r > 0) {
            var prev = self.bracket.rounds[r-1] || [];
            [prev[m*2], prev[m*2+1]].forEach(function(fe) {
              if (!fe) return;
              ['p1','p2'].forEach(function(k){
                var p = fe[k];
                if (!p) return;
                var id = p.id || ('br_' + (r-1) + '_' + (m*2) + '_' + k + '_' + (p.name||'').replace(/\s+/g,'_'));
                // if option with this value already exists, skip
                if (sel.querySelector('option[value="' + id + '"]')) return;
                var opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (p.name || '');
                // mark selected if matches currentId (fallback)
                if (id === currentId) opt.selected = true;
                // attach data to recover name and hc later
                opt.dataset.feedName = p.name || '';
                opt.dataset.feedHc = p.hc || '';
                sel.appendChild(opt);
              });
            });
          }
        } catch (e) {}
      });
    },


    renderStats: function () {
      // Compute payment summary based on participants and fee
      var fee = parseFloat(this.tournament && this.tournament.fee) || 0;
      var participants = Array.isArray(this.participants) ? this.participants : [];
      var totalParticipants = participants.length;
      var cashCount = participants.filter(function (p) { return p && p.status === 'cash'; }).length;
      var tfCount = participants.filter(function (p) { return p && p.status === 'tf'; }).length;

      var bayarCashAmount = cashCount * fee;
      var transferAmount = tfCount * fee;
      var totalBayar = bayarCashAmount + transferAmount;
      var belumBayar = totalBayar - (totalParticipants * fee);

      function setElText(id, value) {
        var el = getElement(id);
        if (!el) return;
        try { el.textContent = Number(value).toLocaleString(); } catch (e) { el.textContent = String(value); }
      }

      setElText('stat-bayar-cash', bayarCashAmount);
      setElText('stat-transfer', transferAmount);
      setElText('stat-total-bayar', totalBayar);
      setElText('stat-belum-bayar', belumBayar);

      // Update header info
      BilposUI.updateHeader(this.tournament);
    },

    wireEvents: function () {
      var self = this;

      if (this._eventsWired) {
        return;
      }
      this._eventsWired = true;

      document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
        item.addEventListener('click', function () {
          var section = item.dataset.section;
          // set active class
          document.querySelectorAll('.sidebar-nav-item').forEach(function(it){ it.classList.remove('active'); });
          item.classList.add('active');
          // Single-page: scroll to section instead of toggling visibility
          var el = document.getElementById('section-' + section);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (section === 'bracket') {
            setTimeout(function () {
              BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper'));
            }, 100);
          }
          if (section === 'statistics') self.renderStats();
        });
      });

      var hamburgerBtn = getElement('hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function () {
          BilposUI.toggleSidebar();
        });
      }

      var sidebarOverlay = getElement('sidebar-overlay');
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
          BilposUI.closeSidebar();
        });
      }

      // Setup fields save automatically (no explicit save button)

      var feeInputEl = getElement('input-fee');
      if (feeInputEl) {
        feeInputEl.addEventListener('input', function (e) {
          var fee = parseFloat(e.target.value) || 0;
          self.tournament.fee = fee;
          BilposStorage.saveTournament(self.tournament);
          self.renderStats();
        });
      }

      var inputSize = getElement('input-size');
      if (inputSize) {
        inputSize.addEventListener('change', function (e) {
          var size = parseInt(e.target.value, 10);
          self.tournament.size = size;
          BilposStorage.saveTournament(self.tournament);
          self.renderParticipantTable();
          self.renderStats();
          var infoRounds = getElement('info-rounds');
          var infoMatches = getElement('info-matches');
          if (infoRounds) infoRounds.textContent = BilposTournament.calcRounds(size);
          if (infoMatches) infoMatches.textContent = BilposTournament.calcMatches(size);
          // update embedded wheel segments when size changes
          try { if (window.BilposWheel) BilposWheel.buildSegments(size); } catch(err) {}
        });
      }

      var generateBracketBtn = getElement('btn-generate-bracket');
      if (generateBracketBtn) {
        generateBracketBtn.addEventListener('click', function () {
          // Only generate bracket data and update UI — do not navigate or show popup
          self.tournament.status = 'ongoing';
          self.tournament.currentRound = 1;
          BilposStorage.saveTournament(self.tournament);
          self.bracket = BilposTournament.generateBracket(self.tournament.size, self.participants);
          // Keep BYE advancement but UI will hide BYE labels
          self.bracket = BilposTournament.autoAdvanceByes(self.bracket);
          BilposStorage.saveBracket(self.bracket);
          self.renderBracket();
          self.renderStats();
        });
      }

      var participantTbody = getElement('participant-tbody');
      if (participantTbody) {
        participantTbody.addEventListener('click', function (e) {
          var btn = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.status-btn') : null;
          if (!btn) return;
          var rowIndex = parseInt(btn.dataset.row, 10);
          var status = btn.dataset.status;
          var row = getElement('row-' + rowIndex);
          var currentStatus = row ? row.dataset.currentStatus : '';
          var newStatus = currentStatus === status ? '' : status;

          if (row) {
            row.classList.remove('row-paid-cash', 'row-paid-tf');
            row.querySelectorAll('.status-btn').forEach(function (button) {
              button.classList.remove('active');
            });
          }

          if (newStatus === 'cash') {
            if (row) row.classList.add('row-paid-cash');
            btn.classList.add('active');
          } else if (newStatus === 'tf') {
            if (row) row.classList.add('row-paid-tf');
            btn.classList.add('active');
          }

          if (row) row.dataset.currentStatus = newStatus;

          var participant = self.getParticipantForRow(rowIndex);
          if (participant && participant.id) {
            participant.status = newStatus;
            BilposStorage.saveParticipant(participant);
            self.participants = BilposStorage.loadParticipants();
            self.renderStats();
          }
        });

        participantTbody.addEventListener('blur', function (e) {
          if (!e.target.classList.contains('phone-input')) return;
          var phone = e.target.value.trim();
          if (!phone) return;
          var rowIndex = parseInt(e.target.dataset.row, 10);
          var existing = BilposStorage.findByPhone(phone);
          if (existing.length > 0) {
            var p = existing[0];
            var nameInput = document.querySelector('.name-input[data-row="' + rowIndex + '"]');
            var hcSelect = document.querySelector('.hc-select[data-row="' + rowIndex + '"]');
            if (nameInput && !nameInput.value) nameInput.value = p.name || '';
            if (hcSelect && !hcSelect.value) {
              var hcValues = ['HC 3B', 'HC 3N', 'HC 3A', 'HC 3+'];
              if (hcValues.indexOf(p.hc) !== -1) hcSelect.value = p.hc;
            }
          }
        }, true);

        participantTbody.addEventListener('change', function (e) {
          if (!e.target.classList.contains('hc-select')) return;
          var rowIndex = e.target.dataset.row;
          var customInput = document.querySelector('.hc-custom-input[data-row="' + rowIndex + '"]');
          if (customInput) {
            if (e.target.value === 'custom') {
              customInput.classList.add('visible');
              customInput.style.display = 'block';
            } else {
              customInput.classList.remove('visible');
              customInput.style.display = 'none';
            }
          }
        });

        participantTbody.addEventListener('click', function (e) {
          var btn = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.btn-draw') : null;
          if (!btn) return;
          var rowIndex = parseInt(btn.dataset.row, 10);
          var phoneInput = document.querySelector('.phone-input[data-row="' + rowIndex + '"]');
          var phone = phoneInput && phoneInput.value.trim() || '';

          var slot = BilposDrawing.drawSlot(
            self.tournament.size,
            BilposStorage.loadParticipants(),
            phone,
            'row-' + rowIndex
          );

          if (slot === null) {
            BilposUI.showToast('Semua slot sudah terisi!', 'warning');
            return;
          }

          var badge = document.querySelector('.drawing-badge[data-row="' + rowIndex + '"]');
          if (badge) badge.textContent = slot;
        });

        participantTbody.addEventListener('blur', function (e) {
          if (!e.target.classList.contains('drawing-badge')) return;
          var rowIndex = parseInt(e.target.dataset.row, 10);
          var slotText = e.target.textContent.trim();
          var slot = parseInt(slotText, 10);

          if (isNaN(slot) || slot < 1) {
            e.target.textContent = '';
            return;
          }

          var result = BilposDrawing.validateSlot(slot, 'row-' + rowIndex, BilposStorage.loadParticipants(), self.tournament.size);
          if (!result.valid) {
            BilposUI.showToast(result.message, 'danger');
            e.target.textContent = '';
            return;
          }
        }, true);
      }

      var drawAllBtn = getElement('btn-draw-all');
      if (drawAllBtn) {
        drawAllBtn.addEventListener('click', function () {
          var size = self.tournament.size;
          var currentParticipants = BilposStorage.loadParticipants();
          var changed = 0;
          var i;

          for (i = 1; i <= size; i += 1) {
            var badge = document.querySelector('.drawing-badge[data-row="' + i + '"]');
            if (badge && !badge.textContent.trim()) {
              var phone = document.querySelector('.phone-input[data-row="' + i + '"]') && document.querySelector('.phone-input[data-row="' + i + '"]').value.trim() || '';
              var slot = BilposDrawing.drawSlot(size, currentParticipants, phone, 'row-' + i);
              if (slot !== null) {
                badge.textContent = slot;
                var existing = currentParticipants.find(function (p) {
                  return p.id === 'row-' + i;
                });
                if (existing) {
                  existing.drawingNumber = slot;
                } else {
                  currentParticipants.push({ id: 'row-' + i, drawingNumber: slot });
                }
                changed += 1;
              }
            }
          }

          BilposStorage.saveParticipants(currentParticipants);
          self.participants = currentParticipants;

          if (changed > 0) {
            BilposUI.showToast(changed + ' drawing berhasil dilakukan!', 'success');
          } else {
            BilposUI.showToast('Semua peserta sudah memiliki drawing number', 'info');
          }
        });
      }

      var participantSearch = getElement('participant-search');
      if (participantSearch) {
        participantSearch.addEventListener('input', function (e) {
          var query = e.target.value.toLowerCase();
          document.querySelectorAll('#participant-tbody tr').forEach(function (row) {
            var name = row.querySelector('.name-input') && row.querySelector('.name-input').value.toLowerCase() || '';
            var phone = row.querySelector('.phone-input') && row.querySelector('.phone-input').value.toLowerCase() || '';
            var visible = !query || name.indexOf(query) !== -1 || phone.indexOf(query) !== -1;
            row.style.display = visible ? '' : 'none';
          });
        });
      }

      // Auto-save participant edits and handle delete
      var participantTbodyEl = getElement('participant-tbody');
      if (participantTbodyEl) {
        participantTbodyEl.addEventListener('input', function (e) {
          var t = e.target;
          if (t.matches('.phone-input') || t.matches('.name-input') || t.matches('.hc-custom-input') || t.matches('.hc-select')) {
            var rowIndex = parseInt(t.dataset.row, 10);
            setTimeout(function () { self.saveParticipantRow(rowIndex); }, 140);
          }
        });

        participantTbodyEl.addEventListener('click', function (e) {
          var del = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.btn-delete-row') : null;
          if (del) {
            var rowIndex = parseInt(del.dataset.row, 10);
            if (confirm('Hapus peserta ini?')) {
              BilposStorage.deleteParticipant('row-' + rowIndex);
              self.participants = BilposStorage.loadParticipants();
              self.renderParticipantTable();
              self.renderStats();
              if (typeof BilposUI !== 'undefined') BilposUI.showToast('Peserta dihapus', 'success');
            }
          }
        });
      }

      var sortAzBtn = getElement('btn-sort-az');
      if (sortAzBtn) {
        sortAzBtn.addEventListener('click', function () {
          self.sortParticipants('az');
        });
      }

      var sortZaBtn = getElement('btn-sort-za');
      if (sortZaBtn) {
        sortZaBtn.addEventListener('click', function () {
          self.sortParticipants('za');
        });
      }

      var bracketRenderArea = getElement('bracket-render-area');
      if (bracketRenderArea) {
        bracketRenderArea.addEventListener('click', function (e) {
          var toggle = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.match-toggle-dot') : null;
          if (toggle) {
            var rIdx = parseInt(toggle.dataset.round, 10);
            var mIdx = parseInt(toggle.dataset.match, 10);
            if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[rIdx] || !self.bracket.rounds[rIdx][mIdx]) return;
            var match = self.bracket.rounds[rIdx][mIdx];
            // Toggle live state: store previous status so we can restore when toggled off
            if (String(match.status) !== 'live') {
              match._prevStatus = match.status || '';
              match.status = 'live';
            } else {
              match.status = match._prevStatus && match._prevStatus !== 'live' ? match._prevStatus : 'pending';
              try { delete match._prevStatus; } catch (e) {}
            }

            BilposStorage.saveBracket(self.bracket);

            // Update DOM state immediately for responsive toggle feedback
            try {
              toggle.classList.toggle('active', match.status === 'live');
              var card = toggle.closest && toggle.closest('.match-card');
              if (card) {
                card.classList.toggle('match-manual-live', match.status === 'live');
                card.classList.toggle('match-live', match.status === 'live');
                // update playing button state
                var btn = card.querySelector && card.querySelector('.btn-playing');
                if (btn) btn.classList.toggle('active', match.status === 'live');
              }
            } catch (domErr) { /* ignore DOM update errors */ }

            try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch(err) { self.renderBracket(); }
            return;
          }

           var sel = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.bracket-select') : null;
           if (sel) {
             // handled by change event
             return;
           }

           var btn = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.btn-playing') : null;
           if (!btn) return;
           var rIdx = parseInt(btn.dataset.round, 10);
           var mIdx = parseInt(btn.dataset.match, 10);
           if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[rIdx] || !self.bracket.rounds[rIdx][mIdx]) return;

           var match = self.bracket.rounds[rIdx][mIdx];
           match.status = match.status === 'live' ? 'pending' : 'live';
           BilposStorage.saveBracket(self.bracket);
           try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) { self.renderBracket(); }
         });

         // handle change events in bracket area (score inputs and select changes)
         bracketRenderArea.addEventListener('change', function (e) {
           var target = e && e.target ? e.target : {};

           // SCORE INPUT handling
           if (target && target.classList && target.classList.contains && target.classList.contains('score-input')) {
             var r = parseInt(target.dataset.round,10) || 0;
             var m = parseInt(target.dataset.match,10) || 0;
             var player = parseInt(target.dataset.player,10) || 1;
             var val = (typeof target.value !== 'undefined') ? String(target.value).trim() : String(target.textContent || '').trim();

             if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[r] || !self.bracket.rounds[r][m]) return;
             var match = self.bracket.rounds[r][m];

             if (player === 1) match.score1 = val; else match.score2 = val;

             // set live while partial scores present; only advance winner when both scores are numeric and decisive
             if (String(match.score1).trim() || String(match.score2).trim()) {
               match.status = 'live';
             }

             var n1 = parseInt(match.score1,10);
             var n2 = parseInt(match.score2,10);
             if (!isNaN(n1) && !isNaN(n2)) {
               if (n1 !== n2) {
                 // decide winner
                 match.winner = n1 > n2 ? match.p1 : match.p2;
                 match.status = 'done';
                 // advance winner to next round
                 try { BilposTournament.advanceWinner(self.bracket, r, m, match.winner); } catch (err) {}
               } else {
                 // tie — keep live
                 match.winner = null;
                 match.status = 'live';
               }
             }

             BilposStorage.saveBracket(self.bracket);
             try { BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) { self.renderBracket(); }
             return;
           }

           // SELECT handling for bracket assignments
           var sel = (target && typeof target.closest === 'function') ? target.closest('.bracket-select') : null;
           if (!sel) return;
           var r = parseInt(sel.dataset.round,10) || 0;
           var m = parseInt(sel.dataset.match,10) || 0;
           var player = parseInt(sel.dataset.player,10) || 1;
           var val = sel.value;
           if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[r] || !self.bracket.rounds[r][m]) return;
           var match = self.bracket.rounds[r][m];

           if (!val) {
             // cleared selection
             if (player === 1) match.p1 = null; else match.p2 = null;
           } else {
             var participant = (self.participants || []).find(function(p){ return p && p.id === val; });
             if (participant) {
               var obj = { id: participant.id, name: participant.name, hc: participant.hc, drawingNumber: participant.drawingNumber };
               if (player === 1) match.p1 = obj; else match.p2 = obj;
             } else {
               // maybe a feeder option created earlier — try to read dataset from option
               var opt = sel.querySelector('option[value="' + val + '"]');
               if (opt) {
                 var name = opt.dataset.feedName || opt.textContent || '';
                 var hc = opt.dataset.feedHc || '';
                 var obj = { id: val, name: name, hc: hc, drawingNumber: null };
                 if (player === 1) match.p1 = obj; else match.p2 = obj;
               }
             }
           }

           BilposStorage.saveBracket(self.bracket);
           try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) { self.renderBracket(); }
         });

        // Bracket manual edits: editable player names
        bracketRenderArea.addEventListener('input', function (e) {
          var el = e.target;
          if (!el.classList.contains('editable-player')) return;
          var rIdx = parseInt(el.dataset.round, 10);
          var mIdx = parseInt(el.dataset.match, 10);
          var playerNum = parseInt(el.dataset.player, 10);

          if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[rIdx] || !self.bracket.rounds[rIdx][mIdx]) return;
          var nameText = el.textContent.trim();

          // Show suggestions as the user types
          if (nameText.length > 0) {
            self.showBracketSuggestions(el, nameText);
          } else {
            self.hideBracketSuggestions();
          }

          // Live-update model while typing so UI reflects changes immediately.
          try {
            var match = self.bracket.rounds[rIdx][mIdx];
            if (!match) return;
            var key = playerNum === 1 ? 'p1' : 'p2';
            match[key] = match[key] || {};
            match[key].name = nameText;
            // Keep id null while typing (avoid premature binding)
            if (match[key].id && String(match[key].id).indexOf('row-') === 0) {
              // if previously bound to a participant id, keep it; otherwise leave unset
            }
            BilposStorage.saveBracket(self.bracket);
            // update connectors and selects to reflect name change
            try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) {}
          } catch (err) { /* silent */ }

          // Actual assignment to bracket happens on focusout (blur) when user selects a suggestion or types exact match.
          
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', function (ev) {
              var target = ev.target;
              if (target && (target.classList && (target.classList.contains('bracket-suggest-item') || target.classList.contains('editable-player')))) return;
              self.hideBracketSuggestions();
            });
 
            // When editable-player loses focus, validate input — only allow names from participant list
            bracketRenderArea.addEventListener('focusout', function (ev) {
              var el = ev.target;
              if (!el || !el.classList || !el.classList.contains('editable-player')) return;
              var rIdx = parseInt(el.dataset.round, 10);
              var mIdx = parseInt(el.dataset.match, 10);
              var playerNum = parseInt(el.dataset.player, 10);
              var nameText = String(el.textContent || '').trim();

              if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[rIdx] || !self.bracket.rounds[rIdx][mIdx]) return;
              var match = self.bracket.rounds[rIdx][mIdx];

              if (!nameText) {
                // clear if empty
                if (playerNum === 1) match.p1 = null;
                else match.p2 = null;
                BilposStorage.saveBracket(self.bracket);
                try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) { self.renderBracket(); }
                self.hideBracketSuggestions();
                return;
              }

              // Try smarter matching: accept "Name" or "Name HC 3B" formats
              var query = String(nameText || '').trim().toLowerCase();
              var matched = (self.participants || []).find(function (p) {
                if (!p || !p.name) return false;
                var nameOnly = String(p.name).trim().toLowerCase();
                var hcPart = String(p.hc || '').trim().toLowerCase();
                var combined = (nameOnly + (hcPart ? ' ' + hcPart : '')).trim();
                return nameOnly === query || combined === query;
              });

              if (matched) {
                var obj = { id: matched.id, name: matched.name, hc: matched.hc, drawingNumber: matched.drawingNumber };
                if (playerNum === 1) match.p1 = obj; else match.p2 = obj;
              } else {
                // invalid — clear
                if (playerNum === 1) match.p1 = null; else match.p2 = null;
              }

              BilposStorage.saveBracket(self.bracket);
              self.renderBracket();
              self.hideBracketSuggestions();
            });

      }

      // select first suggestion on Enter/Tab in bracket suggest
      document.addEventListener('keydown', function(ev){
             if (!self._bracketSuggest) return;
             var items = self._bracketSuggest.querySelectorAll('.bracket-suggest-item');
             if (!items || items.length === 0) return;

             var active = self._bracketSuggest.querySelector('.bracket-suggest-item.active');
             if (ev.key === 'ArrowDown') {
               ev.preventDefault();
               if (!active) { items[0].classList.add('active'); return; }
               var next = active.nextElementSibling || items[0];
               active.classList.remove('active'); next.classList.add('active');
               next.scrollIntoView({block:'nearest'});
             } else if (ev.key === 'ArrowUp') {
               ev.preventDefault();
               if (!active) { items[items.length-1].classList.add('active'); return; }
               var prev = active.previousElementSibling || items[items.length-1];
               active.classList.remove('active'); prev.classList.add('active');
               prev.scrollIntoView({block:'nearest'});
             } else if (ev.key === 'Enter' || ev.key === 'Tab') {
               var target = active || items[0];
               if (target) { target.click(); ev.preventDefault(); }
             }
      });

      // Global fallback: ensure match-toggle-dot works even if click delegation misses it (robust handler)
      document.addEventListener('click', function (ev) {
        var toggle = ev.target.closest && ev.target.closest('.match-toggle-dot');
        if (!toggle) return;
        try {
          var rIdx = parseInt(toggle.dataset.round, 10);
          var mIdx = parseInt(toggle.dataset.match, 10);
          if (!BilposApp.bracket || !BilposApp.bracket.rounds || !BilposApp.bracket.rounds[rIdx] || !BilposApp.bracket.rounds[rIdx][mIdx]) return;
          var match = BilposApp.bracket.rounds[rIdx][mIdx];

          // Toggle live state
          if (String(match.status) !== 'live') {
            match._prevStatus = match.status || '';
            match.status = 'live';
          } else {
            match.status = match._prevStatus && match._prevStatus !== 'live' ? match._prevStatus : 'pending';
            try { delete match._prevStatus; } catch (e) {}
          }

          BilposStorage.saveBracket(BilposApp.bracket);

          // update UI classes immediately
          try {
            toggle.classList.toggle('active', match.status === 'live');
            var card = toggle.closest('.match-card');
            if (card) {
              card.classList.toggle('match-manual-live', match.status === 'live');
              card.classList.toggle('match-live', match.status === 'live');
              var btn = card.querySelector && card.querySelector('.btn-playing');
              if (btn) btn.classList.toggle('active', match.status === 'live');
            }
            try { BilposApp.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch (err) { BilposApp.renderBracket(); }
          } catch (err) { /* silent */ }
        } catch (err) { /* silent */ }
      });

      // Cross-tab realtime sync: listen to storage changes and reload state
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('storage', function (evt) {
          try {
            var key = evt.key;
            if (!key) return;
            var interesting = ['bilpos_bracket', 'bilpos_participants', 'bilpos_tournament', 'bilpos_settings'];
            if (interesting.indexOf(key) === -1) return;
            // reload from storage and re-render
            try { self.tournament = BilposStorage.loadTournament(); } catch (e) {}
            try { self.participants = BilposStorage.loadParticipants(); } catch (e) {}
            try { self.bracket = BilposStorage.loadBracket(); } catch (e) {}
            try { self.settings = BilposStorage.loadSettings(); } catch (e) {}
            try { self.renderParticipantTable(); self.renderBracket(); self.renderStats(); } catch (e) {}
          } catch (err) { /* silent */ }
        });
      }

      // Keyboard activate match-toggle-dot when focused (Space/Enter)
      document.addEventListener('keydown', function (ev) {
        var active = document.activeElement;
        if (!active || !active.classList) return;
        if (!active.classList.contains('match-toggle-dot')) return;
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault(); active.click();
        }
      });
      document.querySelectorAll('.zoom-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var zoom = parseInt(btn.dataset.zoom, 10);
          BilposBracket.setZoom(zoom);
          self.settings.zoom = zoom;
          BilposStorage.saveSettings(self.settings);
        });
      });

      var centerBracketBtn = getElement('btn-center-bracket');
      if (centerBracketBtn) {
        centerBracketBtn.addEventListener('click', function () {
          BilposBracket.centerBracket(getElement('bracket-container'));
        });
      }
 
      var fullscreenBracketBtn = getElement('btn-fullscreen-bracket');
      if (fullscreenBracketBtn) {
        fullscreenBracketBtn.addEventListener('click', function () {
          BilposBracket.toggleFullscreen(getElement('bracket-container'));
        });
      }

      // Zoom range slider (1-100%)
      var zoomRangeEl2 = getElement('zoom-range');
      var zoomValueEl2 = getElement('zoom-value');
      if (zoomRangeEl2) {
        zoomRangeEl2.addEventListener('input', function (e) {
          var raw = parseInt(e.target.value, 10) || 100;
          // clamp to allowed range [65,100] to prevent sliding past min
          var val = raw;
          if (val < 65) val = 65;
          if (val > 100) val = 100;
          // reflect clamped value back to control (fixes browsers that ignore min)
          try { e.target.value = String(val); } catch (err) {}

          // map slider 65-100 -> display 0-100
          var display = Math.round((val - 65) / 35 * 100);
          if (display < 0) display = 0; if (display > 100) display = 100;
          if (zoomValueEl2) zoomValueEl2.textContent = display + '%';
          BilposBracket.setZoom(val);
          // persist
          self.settings = self.settings || {};
          self.settings.zoom = val;
          BilposStorage.saveSettings(self.settings);
        });
      }

      var printBracketBtn = getElement('btn-print-bracket');
      if (printBracketBtn) {
        printBracketBtn.addEventListener('click', function () {
          self.printBracket();
        });
      }

      var printBracketBtn2 = getElement('btn-print-bracket-2');
      if (printBracketBtn2) {
        printBracketBtn2.addEventListener('click', function () {
          self.printBracket();
        });
      }

      var exportJsonBtn = getElement('btn-export-json');
      if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', function () {
          self.exportJSON();
        });
      }

      var exportExcelBtn = getElement('btn-export-excel');
      if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function () {
          self.exportExcel();
        });
      }

      var exportPdfBtn = getElement('btn-export-pdf');
      if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function () {
          self.exportBracketPDF();
        });
      }

      var importJsonInput = getElement('import-json-input');
      if (importJsonInput) {
        importJsonInput.addEventListener('change', function (e) {
          self.importJSON(e.target.files[0]);
        });
      }

      var importExcelInput = getElement('import-excel-input');
      if (importExcelInput) {
        importExcelInput.addEventListener('change', function (e) {
          self.importExcel(e.target.files[0]);
        });
      }

      var settingZoom = getElement('setting-zoom');
      if (settingZoom) {
        settingZoom.addEventListener('change', function (e) {
          var zoom = parseInt(e.target.value, 10);
          self.settings.zoom = zoom;
          BilposStorage.saveSettings(self.settings);
          BilposBracket.setZoom(zoom);
        });
      }

      var resetAllBtn = getElement('btn-reset-all');
      if (resetAllBtn) {
        resetAllBtn.addEventListener('click', function () {
          if (confirm('RESET SEMUA DATA? Tindakan ini tidak dapat dibatalkan!')) {
            BilposStorage.clearAll();
            location.reload();
          }
        });
      }

      var deleteAllBtn = getElement('btn-delete-all');
      if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function () {
          if (confirm('Hapus semua peserta? Tindakan ini akan mengosongkan daftar peserta dan bracket.')) {
            BilposStorage.saveParticipants([]);
            BilposStorage.clearBracket();
            self.participants = [];
            self.bracket = null;
            self.renderParticipantTable();
            self.renderBracket();
            self.renderStats();
            if (typeof BilposUI !== 'undefined') BilposUI.showToast('Semua peserta dihapus', 'success');
          }
        });
      }
    },

    getParticipantForRow: function (rowIndex) {
      var participantId = 'row-' + rowIndex;
      var found = (this.participants || []).find(function (participant) {
        return participant && participant.id === participantId;
      });

      return found || {
        id: participantId,
        slot: parseInt(rowIndex, 10),
        phone: '',
        name: '',
        hc: '',
        hcCustom: '',
        status: '',
        drawingNumber: null
      };
    },

    collectTableRows: function () {
      var size = parseInt(this.tournament && this.tournament.size, 10) || 32;
      var rows = [];
      var i;

      for (i = 1; i <= size; i += 1) {
        var phone = document.querySelector('.phone-input[data-row="' + i + '"]');
        var name = document.querySelector('.name-input[data-row="' + i + '"]');
        var hcSelectEl = document.querySelector('.hc-select[data-row="' + i + '"]');
        var hcCustomEl = document.querySelector('.hc-custom-input[data-row="' + i + '"]');
        var drawingBadge = document.querySelector('.drawing-badge[data-row="' + i + '"]');
        var rowEl = getElement('row-' + i);
        var hcValue = hcSelectEl ? hcSelectEl.value : '';
        var hcCustom = hcCustomEl ? hcCustomEl.value.trim() : '';
        var hc = hcValue === 'custom' ? hcCustom : hcValue;
        var drawingText = drawingBadge ? drawingBadge.textContent.trim() : '';
        var drawingNumber = parseInt(drawingText, 10);
        var existingParticipant = (this.participants || []).find(function(p){ return p && p.id === 'row-' + i; });
        var phoneValue = phone ? phone.value.trim() : (existingParticipant ? (existingParticipant.phone || '') : '');

        rows.push({
          id: 'row-' + i,
          slot: i,
          phone: phoneValue,
          name: name ? name.value.trim() : '',
          hc: hc,
          hcCustom: hcValue === 'custom' ? hcCustom : '',
          status: rowEl ? rowEl.dataset.currentStatus || '' : '',
          drawingNumber: isNaN(drawingNumber) ? null : drawingNumber,
          _sourceRow: i
        });
      }

      return rows;
    },

    updateBracketParticipantIds: function (sourceRows, savedParticipants) {
      var idMap = {};
      var roundIndex;
      var matchIndex;

      if (!this.bracket || !this.bracket.rounds || !Array.isArray(savedParticipants)) {
        return;
      }

      savedParticipants.forEach(function (participant, index) {
        var source = sourceRows[index];
        if (source && source.id && participant && participant.id) {
          idMap[source.id] = participant;
        }
      });

      for (roundIndex = 0; roundIndex < this.bracket.rounds.length; roundIndex += 1) {
        var round = this.bracket.rounds[roundIndex];
        if (!Array.isArray(round)) {
          continue;
        }

        for (matchIndex = 0; matchIndex < round.length; matchIndex += 1) {
          var match = round[matchIndex];
          var keys = ['p1', 'p2', 'winner'];
          var keyIndex;

          if (!match) {
            continue;
          }

          for (keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
            var key = keys[keyIndex];
            var ref = match[key];
            var replacement = ref && ref.id ? idMap[ref.id] : null;
            if (replacement) {
              match[key].id = replacement.id;
              match[key].name = replacement.name;
              match[key].hc = replacement.hc;
              match[key].drawingNumber = replacement.drawingNumber;
            }
          }
        }
      }

      BilposStorage.saveBracket(this.bracket);
    },

    /* Bracket suggestion helpers: show/hide suggestion box when user types in bracket name fields */
    showBracketSuggestions: function (el, query) {
      try {
        this.hideBracketSuggestions();
        var items = [];
        // If this is a bracket field, prefer suggestions from feeding matches (previous round)
        try {
          var rIdx = parseInt(el.dataset.round, 10);
          var mIdx = parseInt(el.dataset.match, 10);
          if (!isNaN(rIdx) && rIdx > 0 && this.bracket && this.bracket.rounds && Array.isArray(this.bracket.rounds)) {
            var prevRound = this.bracket.rounds[rIdx - 1] || [];
            var feederA = prevRound[mIdx * 2] || null;
            var feederB = prevRound[mIdx * 2 + 1] || null;
            var nameSet = {};
            [feederA, feederB].forEach(function (fe) {
              if (!fe) return;
              ['p1','p2'].forEach(function (k) {
                try {
                  var name = (fe[k] && fe[k].name) ? String(fe[k].name).trim() : '';
                  var hc = (fe[k] && fe[k].hc) ? String(fe[k].hc).trim() : '';
                  if (name) {
                    nameSet[name + (hc ? '|' + hc : '')] = { name: name, hc: hc };
                  }
                } catch (err) {}
              });
            });
            Object.keys(nameSet).forEach(function (key) { items.push(nameSet[key]); });
          }
        } catch (err) {}

        // Fallback to global participants when no feeders or match is round 0
        if (items.length === 0) {
          items = (this.participants || []).filter(function (p) {
            return p && p.name && String(p.name).toLowerCase().indexOf(String(query).toLowerCase()) !== -1;
          }).slice(0, 8);
        }

        if (!items || items.length === 0) return;

        var container = document.createElement('div');
        container.className = 'bracket-suggest';

        var self = this;
        items.forEach(function (p) {
          var item = document.createElement('div');
          item.className = 'bracket-suggest-item';
          item.textContent = (p.name || '') + (p.hc ? ' ' + p.hc : '');
          item.dataset.pid = p.id;
          item.dataset.name = p.name || '';
          item.dataset.hc = p.hc || '';
          container.appendChild(item);
        });

        document.body.appendChild(container);
        var rect = el.getBoundingClientRect();
        container.style.left = (rect.right + window.scrollX + 8) + 'px';
        container.style.top = (rect.top + window.scrollY) + 'px';

        container.addEventListener('click', function (ev) {
          var node = ev.target.closest('.bracket-suggest-item');
          if (!node) return;
          var name = node.dataset.name || '';
          var hc = node.dataset.hc || '';
          var rIdx = parseInt(el.dataset.round, 10);
          var mIdx = parseInt(el.dataset.match, 10);
          var playerNum = parseInt(el.dataset.player, 10);

          if (!self.bracket || !self.bracket.rounds || !self.bracket.rounds[rIdx] || !self.bracket.rounds[rIdx][mIdx]) return;
          var match = self.bracket.rounds[rIdx][mIdx];

          // Try to find a real participant id matching name+hc; prefer exact match
          var matched = (self.participants || []).find(function(p){
            if (!p || !p.name) return false;
            var nm = String(p.name).trim();
            var hcval = String(p.hc || '').trim();
            return nm === name && (hcval === hc || (!hc && !hcval));
          });

          if (matched) {
            var obj = { id: matched.id, name: matched.name, hc: matched.hc, drawingNumber: matched.drawingNumber };
            if (playerNum === 1) match.p1 = obj; else match.p2 = obj;
          } else {
            if (playerNum === 1) {
              match.p1 = match.p1 || {};
              match.p1.name = name;
              match.p1.hc = hc;
            } else {
              match.p2 = match.p2 || {};
              match.p2.name = name;
              match.p2.hc = hc;
            }
          }

          BilposStorage.saveBracket(self.bracket);
          try { self.populateBracketSelects(); BilposBracket.drawConnectors(document.querySelector('.bracket-wrapper')); } catch(err) { self.renderBracket(); }
          self.hideBracketSuggestions();
        });

        this._bracketSuggest = container;
      } catch (err) {
        // silent
      }
    },

    hideBracketSuggestions: function () {
      try {
        if (this._bracketSuggest) {
          if (this._bracketSuggest.remove) this._bracketSuggest.remove();
          else if (this._bracketSuggest.parentNode) this._bracketSuggest.parentNode.removeChild(this._bracketSuggest);
          this._bracketSuggest = null;
        }
      } catch (err) {}
    },

    sortParticipants: function (order) {
      var rows = this.collectTableRows();
      var meaningfulRows = rows.filter(hasMeaningfulParticipantData);
      var sortedRows = sortByName(meaningfulRows.slice(), order);
      var savedParticipants = [];
      var i;

      this.sortOrder = order;

      for (i = 0; i < sortedRows.length; i += 1) {
        savedParticipants.push({
          id: 'row-' + (i + 1),
          slot: i + 1,
          phone: sortedRows[i].phone,
          name: sortedRows[i].name,
          hc: sortedRows[i].hc,
          hcCustom: sortedRows[i].hcCustom,
          status: sortedRows[i].status,
          drawingNumber: sortedRows[i].drawingNumber
        });
      }

      BilposStorage.saveParticipants(savedParticipants);

      if (this.bracket) {
        this.updateBracketParticipantIds(sortedRows, savedParticipants);
      }

      this.participants = BilposStorage.loadParticipants();
      this.renderParticipantTable();
      this.renderStats();
      // silent sort (no toast)
    },

    exportJSON: function () {
      var data = BilposStorage.exportAll();
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'bilpos-tournament-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      BilposUI.showToast('Data berhasil diekspor!', 'success');
    },

    importJSON: function (file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          BilposStorage.importAll(data);
          BilposUI.showToast('Data berhasil diimpor!', 'success');
          setTimeout(function () {
            location.reload();
          }, 1000);
        } catch (err) {
          BilposUI.showToast('File JSON tidak valid!', 'danger');
        }
      };
      reader.readAsText(file);
    },

    exportExcel: function () {
      var participants = BilposStorage.loadParticipants();
      var rows = participants.map(function (p, i) {
        return {
          'No': i + 1,
          'Nama': p.name || '',
          'No. HP': p.phone || '',
          'HC': p.hc || '',
          'Status Bayar': p.status || '',
          'Drawing No': p.drawingNumber || ''
        };
      });
      if (typeof XLSX === 'undefined') {
        BilposUI.showToast('Library Excel tidak tersedia', 'danger');
        return;
      }
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Peserta');
      XLSX.writeFile(wb, 'bilpos-peserta-' + new Date().toISOString().slice(0, 10) + '.xlsx');
      BilposUI.showToast('Excel berhasil diekspor!', 'success');
    },

    importExcel: function (file) {
      if (!file || typeof XLSX === 'undefined') {
        BilposUI.showToast('File atau library tidak tersedia', 'danger');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var wb = XLSX.read(e.target.result, { type: 'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = XLSX.utils.sheet_to_json(ws);
          rows.forEach(function (row, i) {
            var p = {
              id: 'row-' + (i + 1),
              slot: i + 1,
              phone: String(row['No. HP'] || ''),
              name: String(row['Nama'] || ''),
              hc: String(row['HC'] || ''),
              status: String(row['Status Bayar'] || ''),
              drawingNumber: parseInt(row['Drawing No'], 10) || null
            };
            BilposStorage.saveParticipant(p);
          });
          BilposUI.showToast('Excel berhasil diimpor!', 'success');
          setTimeout(function () {
            location.reload();
          }, 1000);
        } catch (err) {
          BilposUI.showToast('Gagal membaca file Excel!', 'danger');
        }
      };
      reader.readAsArrayBuffer(file);
    },

    exportBracketPDF: function () {
      var area = getElement('bracket-render-area');
      if (!area || typeof html2canvas === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
        BilposUI.showToast('Library PDF tidak tersedia', 'danger');
        return;
      }
      BilposUI.showToast('Memproses PDF...', 'info');
      html2canvas(area, { backgroundColor: '#111111', scale: 1.5 }).then(function (canvas) {
        var imgData = canvas.toDataURL('image/png');
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('bilpos-bracket-' + new Date().toISOString().slice(0, 10) + '.pdf');
        BilposUI.showToast('PDF berhasil diekspor!', 'success');
      });
    },

    printBracket: function () {
      window.print();
    },

    saveParticipantRow: function (rowIndex) {
      rowIndex = parseInt(rowIndex, 10);
      var phone = document.querySelector('.phone-input[data-row="' + rowIndex + '"]') && document.querySelector('.phone-input[data-row="' + rowIndex + '"]').value.trim() || '';
      var name = document.querySelector('.name-input[data-row="' + rowIndex + '"]') && document.querySelector('.name-input[data-row="' + rowIndex + '"]').value.trim() || '';
      var hcSelectEl = document.querySelector('.hc-select[data-row="' + rowIndex + '"]');
      var hcCustomEl = document.querySelector('.hc-custom-input[data-row="' + rowIndex + '"]');
      var hcValue = hcSelectEl && hcSelectEl.value || '';
      var hcCustom = hcCustomEl && hcCustomEl.value.trim() || '';
      var hc = hcValue === 'custom' ? hcCustom : hcValue;

      var drawingBadge = document.querySelector('.drawing-badge[data-row="' + rowIndex + '"]');
      var drawingNumber = parseInt(drawingBadge && drawingBadge.textContent, 10) || null;

      var row = getElement('row-' + rowIndex);
      var status = row && row.dataset.currentStatus || '';

      if (!name && !phone) {
        BilposUI.showToast('Nama atau nomor HP harus diisi', 'warning');
        return;
      }

      if (drawingNumber) {
        var existingParticipants = BilposStorage.loadParticipants().filter(function (p) {
          return p.id !== 'row-' + rowIndex;
        });
        var dupCheck = existingParticipants.find(function (p) {
          return p.drawingNumber === drawingNumber;
        });
        if (dupCheck) {
          BilposUI.showToast('Drawing number sudah digunakan peserta lain!', 'danger');
          return;
        }
      }

      var participant = {
        id: 'row-' + rowIndex,
        slot: rowIndex,
        phone: phone,
        name: name,
        hc: hc,
        hcCustom: hcValue === 'custom' ? hcCustom : '',
        status: status,
        drawingNumber: drawingNumber
      };

      BilposStorage.saveParticipant(participant);
      this.participants = BilposStorage.loadParticipants();

      var bracketChanged = false;
      if (this.bracket) {
        // First try to sync by participant id (existing behavior)
        this.bracket = BilposTournament.syncParticipantInBracket(this.bracket, participant.id, name, hc);
        // Additionally, reconcile by drawingNumber if bracket slots used drawing numbers but lacked participant ids
        try {
          for (var ri = 0; ri < this.bracket.rounds.length; ri += 1) {
            var round = this.bracket.rounds[ri] || [];
            for (var mi = 0; mi < round.length; mi += 1) {
              var match = round[mi] || {};
              ['p1','p2','winner'].forEach(function (k) {
                try {
                  var ref = match[k];
                  if (!ref) return;
                  var refDrawing = ref.drawingNumber != null ? Number(ref.drawingNumber) : null;
                  var participantDrawing = participant.drawingNumber != null ? Number(participant.drawingNumber) : null;
                  var participantSlot = participant.slot != null ? Number(participant.slot) : null;
                  // match by drawingNumber OR by participant slot (row index) to reflect immediate table edits
                  if ((ref.id == null || ref.id === '') && refDrawing != null && (refDrawing === participantDrawing || refDrawing === participantSlot)) {
                    ref.id = participant.id;
                    ref.name = participant.name;
                    ref.hc = participant.hc;
                    bracketChanged = true;
                  }
                } catch (e) {}
              });
            }
          }
        } catch (err) {}

        if (this.bracket) {
          try {
            // Regenerate bracket deterministically from current participants: assign drawingNumber = slot when missing
            var size = this.tournament && this.tournament.size ? Number(this.tournament.size) : null;
            var participantsForGen = (this.participants || []).map(function(p){
              var copy = Object.assign({}, p);
              if (copy.drawingNumber == null && copy.slot != null) copy.drawingNumber = Number(copy.slot);
              return copy;
            });
            try { console.log('Regenerating bracket from participants', JSON.stringify(participantsForGen).slice(0,200)); } catch(e) {}
            this.bracket = BilposTournament.generateBracket(size, participantsForGen);
            this.bracket = BilposTournament.autoAdvanceByes(this.bracket);
            BilposStorage.saveBracket(this.bracket);
          } catch (e) {
            // fallback to existing reconciliation if regenerate fails
            if (bracketChanged) {
              BilposStorage.saveBracket(this.bracket);
            }
          }
        }
      }

      // Re-render immediately so UI matches stored state
      this.renderBracket();
      this.renderStats();
      // notify user participant saved — silent save per user request (no toast).
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    BilposApp.init();
  });

  if (typeof window !== 'undefined') {
    window.BilposApp = BilposApp;
  }
})();
