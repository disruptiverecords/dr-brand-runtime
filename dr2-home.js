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
