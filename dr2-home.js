/* Disruptive Records — draft home runtime */
(function () {
  if (!window.customElements) return;
  document.documentElement.classList.add("dr2-js");
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function sym(o) {
    var s = document.createElement("dr-symbol");
    for (var k in o) s.setAttribute(k, o[k]);
    s.style.width = "100%"; s.style.height = "100%";
    return s;
  }
  function boot() {
    var show = !REDUCE && !sessionStorage.getItem("dr2L");
    if (show) {
      sessionStorage.setItem("dr2L", "1");
      var loader = document.createElement("div");
      loader.id = "dr2-loader";
      loader.innerHTML = '<div class="dr2-l-sym"></div><div class="dr2-l-row"><span class="dr2-l-count">000</span><span class="dr2-l-label">Disruptive Records</span></div><div class="dr2-l-line"><span class="dr2-l-dot"></span></div>';
      document.body.appendChild(loader);
      loader.querySelector(".dr2-l-sym").appendChild(sym({ mode: "draw", stroke: "3.2", speed: "1.15" }));
      var t0 = performance.now(), D = 2300;
      var cnt = loader.querySelector(".dr2-l-count"), dot = loader.querySelector(".dr2-l-dot");
      requestAnimationFrame(function tick(n) {
        var p = Math.min(1, (n - t0) / D);
        var e = 1 - Math.pow(1 - p, 3);
        cnt.textContent = String(Math.round(e * 100)).padStart(3, "0");
        dot.style.left = (e * 100) + "%";
        if (p < 1) requestAnimationFrame(tick);
        else { loader.classList.add("dr2-l-done"); document.documentElement.classList.add("dr2-ready"); setTimeout(function () { loader.remove(); }, 900); }
      });
    }
    if (!show) document.documentElement.classList.add("dr2-ready");
    var hs = document.getElementById("dr2-hero-symbol");
    if (hs) {
      hs.style.color = "#edeae4";
      var hv = hs.querySelector("video");
      if (hv) hv.remove();
      hs.appendChild(sym({ mode: show ? "ambient" : "draw", hover: "", stroke: "2.8" }));
    }
    var covers = document.querySelectorAll("[data-dr-cover]");
    for (var i = 0; i < covers.length; i++) {
      if (covers[i].querySelector("img")) continue;
      var w = document.createElement("div");
      w.style.cssText = "width:62%;height:62%;opacity:.3;color:#edeae4";
      w.appendChild(sym({ mode: "ambient", stroke: "3.4", speed: String(0.5 + i * 0.18), amp: "3" }));
      covers[i].appendChild(w);
    }
    var fs = document.getElementById("dr2-footer-symbol");
    if (fs) {
      fs.style.color = "#edeae4";
      var fi = fs.querySelector("img");
      if (fi) fi.remove();
      fs.appendChild(sym({ mode: "ambient", hover: "", stroke: "3.2" }));
    }
    var rev = [].slice.call(document.querySelectorAll("[data-reveal]"));
    if (REDUCE || !("IntersectionObserver" in window)) {
      rev.forEach(function (e) { e.classList.add("dr2-in"); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            var el = en.target;
            var sibs = rev.filter(function (x) { return x.parentNode === el.parentNode; });
            el.style.transitionDelay = (Math.max(0, sibs.indexOf(el)) * 90) + "ms";
            el.classList.add("dr2-in");
            io.unobserve(el);
          }
        });
      }, { threshold: 0.15 });
      rev.forEach(function (e) { io.observe(e); });
    }
    if (!REDUCE) {
      [].forEach.call(document.querySelectorAll(".dr2-btn"), function (b) {
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) / r.width;
          var y = (e.clientY - r.top - r.height / 2) / r.height;
          b.style.transform = "translate(" + (x * 8).toFixed(1) + "px," + (y * 6).toFixed(1) + "px)";
        });
        b.addEventListener("pointerleave", function () { b.style.transform = ""; });
      });
      [].forEach.call(document.querySelectorAll(".dr2-card"), function (c) {
        var cov = c.querySelector(".dr2-cover");
        if (!cov) return;
        c.addEventListener("pointermove", function (e) {
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          cov.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg) translateY(-4px)";
        });
        c.addEventListener("pointerleave", function () { cov.style.transform = ""; });
      });
    }


    /* v6: atmosphere + grain layers (ported from main site), partner icons */
    var atmos = document.createElement("div");
    atmos.className = "dr2-atmos";
    atmos.innerHTML = '<div class="dr2-atmos-shapes"><div class="dr2-ash dr2-ash1"></div><div class="dr2-ash dr2-ash2"></div><div class="dr2-ash dr2-ash3"></div></div>';
    document.body.insertBefore(atmos, document.body.firstChild);
    var grainFix = document.createElement("div");
    grainFix.className = "dr2-grainfix";
    document.body.appendChild(grainFix);
    [].forEach.call(document.querySelectorAll(".dr2-pcell"), function (c) {
      var ic = c.getAttribute("data-icon");
      if (!ic) return;
      var im = document.createElement("img");
      im.src = "https://cdn.simpleicons.org/" + ic + "/edeae4";
      im.alt = "";
      im.loading = "lazy";
      c.insertBefore(im, c.firstChild);
    });
    /* ---- v4: company entity ---- */
    /* 1B counter */
    var cnt = document.getElementById("dr2-count-num");
    if (cnt) {
      var TARGET = 1e9, fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
      if (REDUCE) { cnt.textContent = fmt(TARGET); var pr = document.getElementById("dr2-count-plus"); if (pr) pr.classList.add("on"); }
      else {
        var cDone = false;
        var ioC = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (!en.isIntersecting || cDone) return;
            cDone = true; ioC.disconnect();
            var t0 = performance.now(), D = 2600;
            (function tick(now) {
              var p = Math.min(1, (now - t0) / D);
              var e = 1 - Math.pow(1 - p, 4);
              cnt.textContent = fmt(e * TARGET);
              if (p < 1) requestAnimationFrame(tick);
              else { var pl = document.getElementById("dr2-count-plus"); if (pl) pl.classList.add("on"); }
            })(t0);
          });
        }, { threshold: 0.35 });
        ioC.observe(cnt);
      }
    }
    /* streams graph: inject svg, draw on view */
    var gph = document.getElementById("dr2-graph");
    if (gph) {
      var NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 1000 240");
      svg.setAttribute("preserveAspectRatio", "none");
      var base = document.createElementNS(NS, "path");
      base.setAttribute("class", "dr2-graph-base");
      base.setAttribute("d", "M0,222 L1000,222");
      var line = document.createElementNS(NS, "path");
      line.setAttribute("class", "dr2-graph-line");
      line.setAttribute("d", "M0,218 C140,214 260,206 390,188 C520,170 640,134 760,88 C840,57 930,30 1000,14");
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "dr2-graph-dot");
      dot.setAttribute("cx", "1000"); dot.setAttribute("cy", "14"); dot.setAttribute("r", "5");
      svg.appendChild(base); svg.appendChild(line); svg.appendChild(dot);
      var years = ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
      for (var yi = 0; yi < years.length; yi++) {
        var t = document.createElementNS(NS, "text");
        t.setAttribute("class", "dr2-graph-tick");
        t.setAttribute("x", String(8 + yi * (970 / 7)));
        t.setAttribute("y", "238");
        t.textContent = years[yi];
        svg.appendChild(t);
      }
      var cap = document.createElementNS(NS, "text");
      cap.setAttribute("class", "dr2-graph-cap");
      cap.setAttribute("x", "0"); cap.setAttribute("y", "10");
      cap.textContent = "STREAMS / YEAR \u2014 CUMULATIVE";
      svg.appendChild(cap);
      gph.appendChild(svg);
      var L = line.getTotalLength();
      line.style.strokeDasharray = String(L);
      line.style.strokeDashoffset = REDUCE ? "0" : String(L);
      line.style.transition = "stroke-dashoffset 2.6s cubic-bezier(.65,0,.35,1)";
      if (!REDUCE) {
        var ioG = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (!en.isIntersecting) return;
            ioG.disconnect();
            requestAnimationFrame(function () { line.style.strokeDashoffset = "0"; });
            setTimeout(function () { gph.classList.add("on"); }, 2300);
          });
        }, { threshold: 0.3 });
        ioG.observe(gph);
      } else gph.classList.add("on");
    }
    /* activities: scroll-activated giant words */
    var actRows = document.querySelectorAll(".dr2-act-row");
    if (actRows.length) {
      var ioA = new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.target.classList.toggle("on", en.isIntersecting); });
      }, { rootMargin: "-32% 0px -32% 0px" });
      [].forEach.call(actRows, function (r) {
        ioA.observe(r);
        r.addEventListener("pointerenter", function () { r.classList.add("on"); });
      });
    }
    var nav = document.getElementById("dr2-nav");
    var lastY = 0;
    function onScroll() {
      if (nav) {
        nav.classList.toggle("dr2-scrolled", scrollY > 8);
        nav.classList.toggle("dr2-nav-hidden", scrollY > 160 && scrollY > lastY);
        lastY = scrollY;
      }
      if (hs) {
        hs.style.transform = "translateY(calc(-50% + " + (scrollY * 0.08) + "px))";
        var c2 = hs.querySelector("dr-symbol");
        if (c2 && !REDUCE) c2._twist = Math.min(44, scrollY * 0.045);
      }
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
