/* ============================================================
   <dr-symbol> — Disruptive Records animated brand symbol
   ------------------------------------------------------------
   Zero-dependency web component. The vortex is reconstructed
   from the Illustrator master ("Disruptive Symbol.ai") as 21
   exact ellipses — vector-faithful at rest, animatable per ring.

   Usage:
     <script src="dr-symbol.js"></script>
     <dr-symbol mode="ambient" hover style="width:160px"></dr-symbol>

   Attributes:
     mode="static"   — exact mark, no motion (default)
     mode="ambient"  — continuous gentle flow (traveling wave)
     mode="draw"     — stroke-draw-on once, then settles into ambient
     mode="scroll"   — vortex winds/unwinds with scroll position
     hover           — pointer parallax tilt + flow acceleration
     color="#edeae4" — stroke colour (default: currentColor)
     stroke="2.6"    — stroke width in viewBox units (1000)
     speed="1"       — flow speed multiplier
     amp="2.2"       — flow amplitude in degrees

   Events:  "dr-drawn" fires when mode="draw" finishes drawing.
   API:     el.freezeDraw(0..1)  el.setTwist(deg)  — for tests/screenshots.
   Honors prefers-reduced-motion (renders static).
   The ® mark is NOT part of this component — keep it static
   outside the animated symbol (see LOGO_USAGE.md).
   ============================================================ */
(function () {
  "use strict";

  /* [dx, dy, rx, ry, angle] per ring, unit-normalized from the AI master.
     Order: outermost → innermost. */
  var RINGS = [
    [-0.0421,-0.0432,0.9194,1.0000,84.94],
    [-0.0424,-0.0438,0.9996,0.9998,29.24],
    [-0.0425,-0.0431,0.8458,0.9995,82.61],
    [-0.0427,-0.0430,0.7786,0.9986,80.22],
    [-0.0426,-0.0430,0.7178,0.9968,77.61],
    [-0.0431,-0.0420,0.6630,0.9937,75.16],
    [-0.0427,-0.0425,0.6127,0.9893,72.79],
    [-0.0427,-0.0425,0.5673,0.9832,70.46],
    [-0.0427,-0.0430,0.5257,0.9752,68.20],
    [-0.0427,-0.0430,0.4886,0.9654,65.94],
    [-0.0427,-0.0430,0.4552,0.9534,63.72],
    [-0.0428,-0.0430,0.4250,0.9394,61.55],
    [-0.0428,-0.0431,0.3978,0.9232,59.42],
    [-0.0425,-0.0424,0.3734,0.9051,57.32],
    [-0.0426,-0.0435,0.3513,0.8854,55.24],
    [-0.0428,-0.0432,0.3315,0.8640,53.17],
    [-0.0430,-0.0431,0.3136,0.8402,51.18],
    [-0.0431,-0.0427,0.2974,0.8147,49.25],
    [-0.0431,-0.0427,0.2829,0.7878,47.30],
    [-0.0431,-0.0427,0.2698,0.7598,45.36],
    [-0.0428,-0.0430,0.2580,0.7314,43.41]
  ];

  var SIZE = 1000, HALF = SIZE / 2, SCALE = HALF * 0.94;
  var N = RINGS.length;
  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  var DRSymbol = function () { return Reflect.construct(HTMLElement, [], DRSymbol); };
  DRSymbol.prototype = Object.create(HTMLElement.prototype);
  DRSymbol.prototype.constructor = DRSymbol;
  Object.setPrototypeOf(DRSymbol, HTMLElement);

  DRSymbol.prototype.connectedCallback = function () {
    if (this._built) return;
    this._built = true;

    var mode   = this.getAttribute("mode")  || "static";
    var color  = this.getAttribute("color") || "currentColor";
    var stroke = parseFloat(this.getAttribute("stroke") || "2.6");
    this._speed = parseFloat(this.getAttribute("speed") || "1");
    this._amp   = parseFloat(this.getAttribute("amp")   || "2.2");
    this._hover = this.hasAttribute("hover") && !REDUCED;
    this._mode  = REDUCED ? "static" : mode;

    this.style.display = this.style.display || "inline-block";
    this.style.aspectRatio = "1";
    /* default size only when nothing else (inline or stylesheet) sizes it */
    var cw = getComputedStyle(this).width;
    if (!this.style.width && (cw === "auto" || parseFloat(cw) === 0))
      this.style.width = "120px";

    var svg = el("svg", { viewBox: "0 0 " + SIZE + " " + SIZE, width: "100%", height: "100%", "aria-hidden": "true" });
    svg.style.display = "block";
    svg.style.willChange = "transform";
    svg.style.transition = "transform 600ms cubic-bezier(0.22,0.61,0.36,1)";
    var g = el("g", { fill: "none", stroke: color, "stroke-width": stroke });
    this._rings = [];
    for (var i = 0; i < N; i++) {
      var r = RINGS[i];
      var cx = HALF + r[0] * SCALE, cy = HALF + r[1] * SCALE;
      var rx = r[2] * SCALE, ry = r[3] * SCALE;
      var e = el("ellipse", { cx: cx, cy: cy, rx: rx, ry: ry });
      e._cx = cx; e._cy = cy; e._a = r[4];
      e._w = 1 - r[2];                       /* thin inner rings twist more */
      /* circumference via Ramanujan — avoids pathLength attr (broken on
         ellipses in Safari, which made the draw-on "just appear") */
      e._len = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
      e.setAttribute("transform", "rotate(" + r[4] + " " + cx + " " + cy + ")");
      g.appendChild(e);
      this._rings.push(e);
    }
    svg.appendChild(g);
    this.appendChild(svg);
    this._svg = svg;

    this._t0 = performance.now();
    this._twist = 0; this._drawP = 1; this._frozen = false;
    this._sw = stroke; this._pulses = []; this._px = 0; this._py = 0;
    this._flowOn = (this._mode === "ambient" || this._mode === "scroll");

    if (this._mode === "draw") this._beginDraw();
    if (this._mode === "scroll") this._bindScroll();
    if (this._hover) this._bindHover();
    if (this._mode !== "static") this._loop();
  };

  DRSymbol.prototype.disconnectedCallback = function () {
    this._dead = true;
    if (this._onScroll) removeEventListener("scroll", this._onScroll);
  };

  /* ---- reveal: the unfurl ----
     All rings start collapsed into one aligned lens (every ring at the
     innermost ring's angle, invisible), then fan open to their resting
     angles while fading in — inner rings lead, outer sweep open last.
     No stroke ends are ever visible, so it reads as the vortex opening,
     not as dashes being traced. */
  DRSymbol.prototype._beginDraw = function () {
    var self = this;
    this._applyDraw(0);
    var T = 2600 / this._speed, start = performance.now();
    function step(now) {
      if (self._dead || self._frozen) return;
      var p = Math.min(1, (now - start) / T);
      self._applyDraw(p);
      if (p < 1) requestAnimationFrame(step);
      else {
        self._flowOn = true;
        self._drawEnd = performance.now();   /* wave ramps in from here */
        self.dispatchEvent(new CustomEvent("dr-drawn", { bubbles: true }));
      }
    }
    requestAnimationFrame(step);
  };

  DRSymbol.prototype._applyDraw = function (p) {
    this._drawP = p;
    var baseA = RINGS[N - 1][4];      /* innermost ring's angle — the closed fan */
    var span = 0.5;
    for (var i = 0; i < N; i++) {
      var e = this._rings[i];
      var lead = ((N - 1 - i) / (N - 1)) * span;   /* inner rings lead */
      var lp = Math.min(1, Math.max(0, (p - lead) / (1 - span)));
      var ease = 1 - Math.pow(1 - lp, 3);
      var a = baseA + (e._a - baseA) * ease;
      e.setAttribute("transform", "rotate(" + a + " " + e._cx + " " + e._cy + ")");
      e.style.opacity = String(Math.min(1, lp * 2.5));
    }
  };

  /* ---- ambient flow + twist + per-ring interaction (one rAF loop) ---- */
  DRSymbol.prototype._ringField = function (e) {
    /* proximity 0..1 of the pointer to THIS ring — distance from the
       pointer to the ring's ellipse, through a gaussian falloff */
    if (!this._hoverActive) return 0;
    var rad = (e._a * Math.PI) / 180;
    var dx = this._px - e._cx, dy = this._py - e._cy;
    var c = Math.cos(rad), s = Math.sin(rad);
    var u = (dx * c + dy * s) / e._rx, v = (-dx * s + dy * c) / e._ry;
    var r = Math.sqrt(u * u + v * v);
    var d = Math.abs(r - 1) * (e._rx + e._ry) / 2;   /* ≈ px distance to ring */
    return Math.exp(-(d * d) / (2 * 80 * 80));
  };

  DRSymbol.prototype._loop = function () {
    var self = this;
    function frame(now) {
      if (self._dead) return;
      if (!self._frozen) {
        var t = (now - self._t0) / 1000;
        var hovBoost = self._hoverActive ? 1.5 : 1;
        /* after a draw reveal, the ambient wave fades in over 1.2s — no pop */
        var ramp = (self._drawEnd) ? Math.min(1, (now - self._drawEnd) / 1200) : 1;
        for (var i = 0; i < N; i++) {
          var e = self._rings[i];
          var wave = self._flowOn
            ? ramp * self._amp * Math.sin((t * self._speed * hovBoost * 2 * Math.PI) / 9 + i * 0.55)
            : 0;
          var tw = self._twist * e._w;
          /* pointer proximity: nearby rings rotate aside and thicken */
          var g = self._ringField(e);
          var rot = g * 7 * (0.5 + e._w);
          /* click pulse: an impulse traveling inward through the stack */
          var pulse = 0;
          for (var k = self._pulses.length - 1; k >= 0; k--) {
            var ph = (now - self._pulses[k]) / 1000 - i * 0.045;
            if (ph > 0.9) { if (i === N - 1) self._pulses.splice(k, 1); continue; }
            if (ph > 0) pulse += 10 * Math.sin(Math.PI * ph / 0.9) * Math.exp(-ph * 2.2);
          }
          e.setAttribute("transform",
            "rotate(" + (e._a + wave + tw + rot + pulse) + " " + e._cx + " " + e._cy + ")");
          if (self._hover)
            e.style.strokeWidth = String(self._sw * (1 + 0.9 * g));
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* ---- scroll scrub ---- */
  DRSymbol.prototype._bindScroll = function () {
    var self = this;
    var max = parseFloat(this.getAttribute("max-twist") || "70");
    this._onScroll = function () {
      var r = self.getBoundingClientRect();
      var vh = innerHeight || 1;
      var p = 1 - Math.min(1, Math.max(0, (r.top + r.height / 2) / (vh + r.height)));
      self._twist = (p - 0.5) * 2 * max;
    };
    addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();
  };

  /* ---- hover: parallax tilt + per-ring proximity + click pulse ---- */
  DRSymbol.prototype._bindHover = function () {
    var self = this;
    this.addEventListener("pointermove", function (ev) {
      var r = self.getBoundingClientRect();
      var nx = (ev.clientX - r.left) / r.width;
      var ny = (ev.clientY - r.top) / r.height;
      self._px = nx * SIZE; self._py = ny * SIZE;   /* viewBox coords for the ring field */
      self._hoverActive = true;
      self._svg.style.transform =
        "perspective(900px) rotateY(" + ((nx - 0.5) * 9) + "deg) rotateX(" + (-(ny - 0.5) * 9) + "deg)";
    });
    this.addEventListener("pointerleave", function () {
      self._hoverActive = false;
      self._svg.style.transform = "";
      for (var i = 0; i < N; i++) self._rings[i].style.strokeWidth = "";
    });
    this.addEventListener("pointerdown", function () {
      self._pulses.push(performance.now());
    });
  };

  /* ---- test/screenshot API ---- */
  DRSymbol.prototype.freezeDraw = function (p) {
    this._frozen = true;
    this._applyDraw(p);
  };
  DRSymbol.prototype.debugPointer = function (nx, ny) {
    /* freeze a hover state at normalized pointer (0..1, 0..1) — for stills */
    this._frozen = true;
    this._px = nx * SIZE; this._py = ny * SIZE; this._hoverActive = true;
    for (var i = 0; i < N; i++) {
      var e = this._rings[i];
      var g = this._ringField(e);
      e.style.opacity = "";
      e.style.strokeWidth = String(this._sw * (1 + 0.9 * g));
      e.setAttribute("transform",
        "rotate(" + (e._a + g * 7 * (0.5 + e._w)) + " " + e._cx + " " + e._cy + ")");
    }
  };
  DRSymbol.prototype.setTwist = function (deg) {
    this._frozen = true;
    for (var i = 0; i < N; i++) {
      var e = this._rings[i];
      e.setAttribute("transform",
        "rotate(" + (e._a + deg * e._w) + " " + e._cx + " " + e._cy + ")");
    }
  };
  /* Deterministic time control — for frame-by-frame video rendering.
     freezeFlow(t): pure ambient-flow state at t seconds (period 9s/speed, seamless loop).
     freezeAt(t):   full ident timeline — draw-on for the first 2.4s, then flow. */
  DRSymbol.prototype.freezeFlow = function (t, ramp) {
    this._frozen = true;
    var k = (ramp == null) ? 1 : ramp;
    for (var i = 0; i < N; i++) {
      var e = this._rings[i];
      e.style.opacity = "";
      var wave = k * this._amp * Math.sin((t * this._speed * 2 * Math.PI) / 9 + i * 0.55);
      e.setAttribute("transform",
        "rotate(" + (e._a + wave) + " " + e._cx + " " + e._cy + ")");
    }
  };
  DRSymbol.prototype.freezeAt = function (t) {
    var T = 2.6 / this._speed;
    if (t < T) this.freezeDraw(t / T);
    else this.freezeFlow(t - T, Math.min(1, (t - T) / 1.2));
  };

  customElements.define("dr-symbol", DRSymbol);
})();
