/* Mikrointerakcje na eksportach z pen.dev — porty animacji z krzysztof-miotk/js/main.js */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. Dryfujący gradient + poświaty na dużych sekcjach gradientowych --- */
  document.querySelectorAll('[style*="linear-gradient"], [style*="radial-gradient"]').forEach(function (el) {
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    var w = el.offsetWidth || 0, h = el.offsetHeight || 0;
    if (w > 900 && h > 160) {
      el.classList.add("km-drift", "km-glows");
      var st = getComputedStyle(el);
      if (st.overflow !== "hidden") el.style.overflow = "hidden";
    }
  });

  /* --- 2. Karty i wiersze — glow za kursorem + lift --- */
  var cardSel = [
    '[data-pencil-name*="Card"]', '[data-pencil-name*="card"]',
    '[data-pencil-name*="Services Row"]', '[data-pencil-name*="FAQ Item"]',
    '[data-pencil-name*="Frame 707"]'
  ].join(",");
  document.querySelectorAll(cardSel).forEach(function (card) {
    if (card.offsetWidth < 120 || card.offsetHeight < 60) return;
    card.classList.add("km-card-fx");
    if (reduced) return;
    if (!card.querySelector(".card-glow")) {
      var g = document.createElement("div");
      g.className = "card-glow";
      card.insertBefore(g, card.firstChild);
    }
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = e.clientX - r.left, py = e.clientY - r.top;
      var gl = card.querySelector(".card-glow");
      if (gl) {
        gl.style.opacity = "1";
        gl.style.background = "radial-gradient(240px circle at " + px + "px " + py + "px, oklch(57.2% 0.21 280 / .14), transparent 70%)";
      }
    });
    card.addEventListener("mouseleave", function () {
      var gl = card.querySelector(".card-glow");
      if (gl) gl.style.opacity = "0";
    });
  });

  /* --- 3. Przyciski — ripple + lift + nawigacja --- */
  var CONTACT = "kontakt.html", SERVICES = "uslugi.html", HOME = "index.html";
  var btnRules = [
    [/umów|napisz wiadomość|wyślij|zapisz się|pobierz/i, CONTACT],
    [/zobacz usług|zobacz wszystkie usługi/i, SERVICES]
  ];
  function buttonTarget(el) {
    var t = (el.textContent || "").trim();
    if (t.length > 60) return null;
    for (var i = 0; i < btnRules.length; i++) if (btnRules[i][0].test(t)) return btnRules[i][1];
    return null;
  }
  document.querySelectorAll("[data-pencil-name]").forEach(function (el) {
    var name = el.getAttribute("data-pencil-name") || "";
    var looksBtn = /button|umów|zobacz|wyślij|zapisz|pobierz|napisz/i.test(name);
    if (!looksBtn) return;
    var style = el.getAttribute("style") || "";
    if (!/background/.test(style) && !/border/.test(style)) return;
    if (el.offsetHeight < 30 || el.offsetHeight > 90) return;
    el.classList.add("km-btn-fx");
    var target = buttonTarget(el);
    el.addEventListener("click", function (e) {
      if (!reduced) {
        var r = el.getBoundingClientRect();
        var s = document.createElement("span");
        s.className = "km-ripple";
        var size = Math.max(r.width, r.height);
        s.style.width = s.style.height = size + "px";
        s.style.left = (e.clientX - r.left - size / 2) + "px";
        s.style.top = (e.clientY - r.top - size / 2) + "px";
        s.style.animation = "km-ripple .6s cubic-bezier(.22,.61,.36,1) forwards";
        el.appendChild(s);
        setTimeout(function () { s.remove(); }, 650);
      }
      if (target) setTimeout(function () { window.location.href = target; }, reduced ? 0 : 180);
    });
  });

  /* --- 4. Nawigacja tekstowa --- */
  var page = location.pathname.split("/").pop() || "index.html";
  var navMap = {
    "Badania UX": SERVICES, "Segmentacja klientów": SERVICES, "Audyt UX": SERVICES,
    "Konsultacje": SERVICES, "Wystąpienia": SERVICES,
    "Usługi": SERVICES, "Kontakt": CONTACT, "Start/": HOME, "Start": HOME,
    "Strona główna": HOME
  };
  document.querySelectorAll("div, span, p").forEach(function (el) {
    if (el.children.length > 0) return;
    var t = (el.textContent || "").trim();
    if (!(t in navMap)) return;
    if (el.closest(".km-btn-fx")) return;
    el.classList.add("km-link-fx");
    el.addEventListener("click", function () { window.location.href = navMap[t]; });
  });
  document.querySelectorAll('[data-pencil-name*="Logo"], [data-pencil-name="Layer_1"]').forEach(function (el) {
    var top = el.closest("header, [data-pencil-name*='menu'], [data-pencil-name*='Nav'], [data-pencil-name*='nav']");
    if (top || el.getBoundingClientRect().top < 120) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function () { window.location.href = HOME; });
    }
  });

  /* --- 5. Reveal przy scrollu --- */
  var main = document.querySelector('[data-pencil-name="main"]') || document.body;
  var sections = Array.prototype.slice.call(main.children).filter(function (el) {
    return el.offsetHeight > 100;
  });
  var revealTargets = [];
  sections.forEach(function (sec) {
    Array.prototype.slice.call(sec.children).forEach(function (child) {
      if (child.offsetHeight > 40 && child.offsetHeight < 2200) revealTargets.push(child);
    });
  });
  if (!reduced && "IntersectionObserver" in window && revealTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) { el.classList.add("km-reveal"); io.observe(el); }
    });
  }

  /* --- 6. Lawendowe taśmy/markery — wjazd scaleX --- */
  document.querySelectorAll('[style*="#A399FD"], [style*="163, 153, 253"]').forEach(function (el) {
    if (el.offsetHeight > 90 || el.offsetWidth < 30) return;
    if (el.querySelector("svg") || el.tagName === "svg" || el.tagName === "path") return;
    el.classList.add("km-tape", "km-tape-hidden");
  });
  if (!reduced && "IntersectionObserver" in window) {
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove("km-tape-hidden");
          en.target.classList.add("km-tape-in");
          tio.unobserve(en.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll(".km-tape").forEach(function (el) { tio.observe(el); });
  } else {
    document.querySelectorAll(".km-tape").forEach(function (el) { el.classList.remove("km-tape-hidden"); });
  }
})();
