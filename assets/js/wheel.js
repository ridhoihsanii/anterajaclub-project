(function(){
  function $(id){return document.getElementById(id);}

  var Wheel = {
    canvas: null,
    ctx: null,
    segments: [],
    size: 32,
    angle: 0,
    spinning: false,
    targetAngle: 0,
    selectedIndex: null, // for keyboard navigation

    init: function(canvasId){
      this.canvas = $(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      var self = this;
      window.addEventListener('resize', this.render.bind(this));

      // focus / click on canvas to enable keyboard navigation
      this.canvas.tabIndex = 0;
      this.canvas.addEventListener('click', function(){ self.canvas.focus(); if (self.selectedIndex == null) self.selectedIndex = 0; self.render(); });
      this.canvas.addEventListener('focus', function(){ if (self.selectedIndex == null) self.selectedIndex = 0; self.render(); });
      this.canvas.addEventListener('blur', function(){ /* keep selection but clear visual if needed */ self.render(); });

      // keyboard navigation: arrows to move selection, Enter to spin targeted segment
      document.addEventListener('keydown', function(e){
        if (!self.canvas || document.activeElement !== self.canvas) return;
        var seg = self.segments.filter(s=>!s.removed);
        if (!seg.length) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){
          e.preventDefault();
          self.selectedIndex = ( (self.selectedIndex || 0) + 1 ) % seg.length;
          self.render();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
          e.preventDefault();
          self.selectedIndex = ( (self.selectedIndex == null ? 0 : self.selectedIndex) - 1 + seg.length) % seg.length;
          self.render();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (self.selectedIndex != null) {
            // spin to selected index
            self.spin(self.selectedIndex);
          } else {
            self.spin();
          }
        }
      });
    },

    buildSegments: function(count){
      this.segments = [];
      for(var i=1;i<=count;i++) this.segments.push({label:String(i), value:i, removed:false});
      this.size = count;
      this.angle = 0;
      this.selectedIndex = null;
      this.render();
    },

    render: function(){
      if (!this.canvas) return;
      var parent = this.canvas.parentElement;
      // limit wheel size to be smaller and responsive
      var maxSize = 420; // smaller wheel
      var w = this.canvas.width = Math.min(maxSize, Math.floor(parent.clientWidth - 40));
      var h = this.canvas.height = w;
      var ctx = this.ctx;
      ctx.clearRect(0,0,w,h);
      var cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 6;
      var seg = this.segments.filter(s=>!s.removed);
      var segCount = seg.length || 1;
      var arc = (Math.PI*2)/segCount;

      for(var i=0;i<segCount;i++){
        var s = seg[i];
        var start = this.angle + i*arc;
        var end = start + arc;
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,r,start,end);
        ctx.closePath();
        // colorful segments using HSL wheel for vibrant colors
        var hue = Math.round((i / segCount) * 360);
        ctx.fillStyle = 'hsl(' + hue + ', 70%, 45%)';
        ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.12)';
        ctx.stroke();

        // draw text
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(start + arc/2);
        ctx.fillStyle='#fff';
        ctx.font = Math.max(12, r*0.08) + 'px Baloo 2';
        ctx.textAlign='right';
        ctx.fillText(s.label, r - 10, 6);
        ctx.restore();
      }

      // if keyboard selection present, draw subtle ring on selected segment
      if (this.selectedIndex != null && segCount > 0) {
        var si = (this.selectedIndex % segCount + segCount) % segCount;
        var selStart = this.angle + si*arc;
        var selEnd = selStart + arc;
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,r,selStart,selEnd);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
        // highlight border
        ctx.beginPath();
        ctx.arc(cx,cy,r - 2, selStart, selEnd);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.stroke();
      }

      // pointer
      ctx.fillStyle='rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.moveTo(cx + r + 6, cy - 10);
      ctx.lineTo(cx + r + 26, cy);
      ctx.lineTo(cx + r + 6, cy + 10);
      ctx.closePath();
      ctx.fill();

      // adjust spin button position (centered over canvas)
      try {
        var btn = document.getElementById('btn-spin-wheel');
        if (btn && parent) {
          var crect = this.canvas.getBoundingClientRect();
          var prect = parent.getBoundingClientRect();
          btn.style.left = (crect.left - prect.left + crect.width/2) + 'px';
          btn.style.top = (crect.top - prect.top + crect.height/2) + 'px';
        }
      } catch (err) {}
    },

    // spin optionally to a specific index (targetIndex) otherwise random
    spin: function(targetIndex){
      if (this.spinning) return;
      var seg = this.segments.filter(s=>!s.removed);
      if (!seg.length) return;
      this.spinning = true;
      var arc = (Math.PI*2)/seg.length;
      var chosen = typeof targetIndex === 'number' ? ( (targetIndex % seg.length + seg.length) % seg.length ) : Math.floor(Math.random()*seg.length);
      var target = (Math.PI*2 - (chosen*arc + arc/2));
      // add extra rotations
      var spins = 3 + Math.floor(Math.random()*3);
      this.targetAngle = spins*(Math.PI*2) + target;
      var self = this;

      var duration = 2600 + Math.floor(Math.random()*1200);
      var start = performance.now();
      var startAngle = this.angle;

      function step(now){
        var t = Math.min(1, (now - start)/duration);
        var eased = 1 - Math.pow(1 - t, 3);
        self.angle = startAngle + (self.targetAngle - startAngle)*eased;
        self.render();
        if (t < 1) requestAnimationFrame(step);
        else {
          self.spinning = false;
          var finalAngle = self.angle % (Math.PI*2);
          var idx = Math.floor(( (Math.PI*2 - finalAngle) / arc )) % seg.length;
          var picked = seg[(idx+seg.length)%seg.length];
          // show popup
          setTimeout(function(){
            // show result modal
            var modal = document.getElementById('wheel-result-modal');
            if (modal) {
              modal.querySelector('.result-number').textContent = picked.label;
              modal.classList.add('active');
              modal.dataset.picked = picked.value;
            } else {
              alert('Angka terpilih: ' + picked.label);
            }
          }, 250);
        }
      }
      requestAnimationFrame(step);
    }
  };

  window.AnterajaWheel = Wheel;

  document.addEventListener('DOMContentLoaded', function(){
    AnterajaWheel.init('wheel-canvas');
    // ensure SPIN label centered
    var spinBtn = document.getElementById('btn-spin-wheel'); if (spinBtn) spinBtn.textContent = 'SPIN';

    // build initial wheel based on current tournament size (embedded at page bottom)
    try {
      var size = parseInt((window.AnterajaApp && window.AnterajaApp.tournament && window.AnterajaApp.tournament.size) || 32, 10);
      AnterajaWheel.buildSegments(size);
    } catch (err) {}

    // ensure remove-selected hidden initially
    // spin button centered inside canvas
    document.getElementById('btn-spin-wheel').addEventListener('click', function(){ AnterajaWheel.spin(); });

    // result modal controls
    var resultClose = document.getElementById('btn-close-result');
    if (resultClose) resultClose.addEventListener('click', function(){ var modal = document.getElementById('wheel-result-modal'); if (modal) { modal.classList.remove('active'); } });
    var resultDel = document.getElementById('btn-delete-result');
        if (resultDel) resultDel.addEventListener('click', function(){ var modal = document.getElementById('wheel-result-modal'); if (!modal) return; var v = parseInt(modal.dataset.picked,10); var seg = AnterajaWheel.segments.find(function(s){ return s.value === v; }); if (seg) seg.removed = true; AnterajaWheel.render(); modal.classList.remove('active'); });
  });
})();
