(function () {
  function toPositiveInt(value) {
    var number = Number(value);

    if (!isFinite(number) || number <= 0 || Math.floor(number) !== number) {
      return null;
    }

    return number;
  }

  function normalizePhone(phone) {
    return String(phone == null ? '' : phone).trim();
  }

  function randomFrom(pool) {
    if (!Array.isArray(pool) || pool.length === 0) {
      return null;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getParticipantId(participant) {
    return participant && participant.id != null ? participant.id : null;
  }

  function phonesMatch(leftPhone, rightPhone) {
    return String(leftPhone == null ? '' : leftPhone).trim() === String(rightPhone == null ? '' : rightPhone).trim();
  }

  var BilposDrawing = {
    generatePool: function (size) {
      var normalizedSize = toPositiveInt(size);
      var pool = [];
      var i;

      if (!normalizedSize) {
        return pool;
      }

      for (i = 1; i <= normalizedSize; i += 1) {
        pool.push(i);
      }

      return pool;
    },

    usedSlots: function (participants) {
      var used = [];
      var i;

      if (!Array.isArray(participants)) {
        return used;
      }

      for (i = 0; i < participants.length; i += 1) {
        var slot = toPositiveInt(participants[i] && participants[i].drawingNumber);

        if (slot) {
          used.push(slot);
        }
      }

      return used;
    },

    availableSlots: function (size, participants) {
      var used = this.usedSlots(participants);
      var usedLookup = {};
      var pool = this.generatePool(size);
      var available = [];
      var i;

      for (i = 0; i < used.length; i += 1) {
        usedLookup[used[i]] = true;
      }

      for (i = 0; i < pool.length; i += 1) {
        if (!usedLookup[pool[i]]) {
          available.push(pool[i]);
        }
      }

      return available;
    },

    drawSlot: function (size, participants, phone, rowId) {
      var list = Array.isArray(participants) ? participants : [];
      var otherParticipants = [];
      var samePhoneParticipants = [];
      var normalizedPhone = normalizePhone(phone);
      var usedQuadrants = [];
      var preferredSlots = [];
      var i;

      for (i = 0; i < list.length; i += 1) {
        if (String(getParticipantId(list[i])) !== String(rowId)) {
          otherParticipants.push(list[i]);
        }

        if (
          String(getParticipantId(list[i])) !== String(rowId) &&
          phonesMatch(list[i] && list[i].phone, phone)
        ) {
          samePhoneParticipants.push(list[i]);
        }
      }

      var available = this.availableSlots(size, otherParticipants);

      if (!available.length) {
        return null;
      }

      if (!normalizedPhone || !samePhoneParticipants.length) {
        return randomFrom(available);
      }

      usedQuadrants = this.usedQuadrants(phone, rowId, list, size);

      for (i = 0; i < available.length; i += 1) {
        if (usedQuadrants.indexOf(this.getQuadrant(available[i], size)) === -1) {
          preferredSlots.push(available[i]);
        }
      }

      return randomFrom(preferredSlots.length ? preferredSlots : available);
    },

    validateSlot: function (slot, rowId, participants, size) {
      var normalizedSlot = toPositiveInt(slot);
      var normalizedSize = toPositiveInt(size);
      var list = Array.isArray(participants) ? participants : [];
      var i;

      if (!normalizedSlot || (normalizedSize && normalizedSlot > normalizedSize)) {
        return {
          valid: false,
          message: 'Nomor slot tidak valid'
        };
      }

      for (i = 0; i < list.length; i += 1) {
        if (String(getParticipantId(list[i])) === String(rowId)) {
          continue;
        }

        if (toPositiveInt(list[i] && list[i].drawingNumber) === normalizedSlot) {
          return {
            valid: false,
            message: 'Drawing number sudah digunakan'
          };
        }
      }

      return {
        valid: true,
        message: ''
      };
    },

    getQuadrant: function (slot, size) {
      var normalizedSlot = toPositiveInt(slot);
      var normalizedSize = toPositiveInt(size);
      var quadrant;

      if (!normalizedSlot || !normalizedSize || normalizedSlot > normalizedSize) {
        return -1;
      }

      quadrant = Math.floor(((normalizedSlot - 1) * 4) / normalizedSize);

      if (quadrant < 0) {
        return 0;
      }

      if (quadrant > 3) {
        return 3;
      }

      return quadrant;
    },

    usedQuadrants: function (phone, rowId, participants, size) {
      var normalizedPhone = normalizePhone(phone);
      var list = Array.isArray(participants) ? participants : [];
      var quadrants = [];
      var seen = {};
      var i;

      if (!normalizedPhone) {
        return quadrants;
      }

      for (i = 0; i < list.length; i += 1) {
        var participant = list[i];
        var quadrant;

        if (
          !phonesMatch(participant && participant.phone, phone) ||
          String(getParticipantId(participant)) === String(rowId)
        ) {
          continue;
        }

        quadrant = this.getQuadrant(participant && participant.drawingNumber, size);

        if (quadrant >= 0 && !seen[quadrant]) {
          seen[quadrant] = true;
          quadrants.push(quadrant);
        }
      }

      return quadrants;
    }
  };

  if (typeof window !== 'undefined') {
    window.BilposDrawing = BilposDrawing;
  }
})();
