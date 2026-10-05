/* Mikrointerakcje na eksportach z pen.dev — porty animacji z krzysztof-miotk/js/main.js */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 0. Pełna szerokość ekranu: skala proporcjonalna + marginesy 140px ≥1480px --- */
  (function () {
    var root = document.body.firstElementChild;
    if (!root) return;
    var designW = root.offsetWidth || 1440;
    var padEls = null;
    function collectPads() {
      padEls = [];
      document.querySelectorAll("div").forEach(function (el) {
        if (el.offsetWidth < designW - 200) return;
        var cs = getComputedStyle(el);
        if (cs.paddingLeft === "100px" && cs.paddingRight === "100px") padEls.push(el);
      });
    }
    function fit() {
      var w = document.documentElement.clientWidth;
      if (padEls === null) collectPads();
      var wide = w >= 1480;
      padEls.forEach(function (el) {
        el.style.paddingLeft = wide ? "140px" : "100px";
        el.style.paddingRight = wide ? "140px" : "100px";
      });
      document.body.style.zoom = w / designW;
    }
    fit();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fit, 80); });
  })();

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

  /* --- 1b. Typografia: bękarty — jednoliterowe spójniki łamane twardą spacją --- */
  function kmNbsp(t) {
    var re = /(^|[\s\u00A0(\u201E>])([aiouwzAIOUWZ]) /g;
    return t.replace(re, "$1$2\u00A0").replace(re, "$1$2\u00A0");
  }
  (function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (!t || t.length < 4) return;
      var p = n.parentElement;
      if (p && /^(SCRIPT|STYLE|INPUT|TEXTAREA)$/.test(p.tagName)) return;
      var r = kmNbsp(t);
      if (r !== t) n.nodeValue = r;
    });
  })();

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
  var CONTACT = "kontakt.html", SERVICES = "uslugi.html", HOME = "index.html", ARTICLES = "artykuly.html";
  var PAGES = {
    "Badania UX": "badania-ux.html",
    "Zewnętrzny Dyrektor UX": "dyrektor-ux.html",
    "Segmentacja klientów": "segmentacja-klientow.html",
    "Audyt UX": "audyt-ux.html",
    "Konsultacje i mentoring": "konsultacje-i-mentoring.html",
    "Wystąpienia i szkolenia": "wystapienia-i-szkolenia.html"
  };
  var PAGE_NAMES = Object.keys(PAGES);
  function serviceCardTarget(el) {
    var node = el.parentElement;
    for (var i = 0; i < 6 && node; i++) {
      var txt = node.textContent || "";
      for (var j = 0; j < PAGE_NAMES.length; j++) {
        if (txt.indexOf(PAGE_NAMES[j]) !== -1) return PAGES[PAGE_NAMES[j]];
      }
      node = node.parentElement;
    }
    return SERVICES;
  }
  var btnRules = [
    [/umów|napisz wiadomość|wyślij|pobierz|^kontakt$/i, CONTACT],
    [/zobacz usług|zobacz wszystkie usługi/i, SERVICES]
  ];
  function buttonTarget(el) {
    var t = (el.textContent || "").trim();
    if (t.length > 60) return null;
    if (/zobacz usługę/i.test(t)) return serviceCardTarget(el);
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
    "Badania UX": PAGES["Badania UX"],
    "Segmentacja klientów": PAGES["Segmentacja klientów"],
    "Audyt UX": PAGES["Audyt UX"],
    "Konsultacje": PAGES["Konsultacje i mentoring"],
    "Konsultacje i mentoring": PAGES["Konsultacje i mentoring"],
    "Wystąpienia": PAGES["Wystąpienia i szkolenia"],
    "Wystąpienia i szkolenia": PAGES["Wystąpienia i szkolenia"],
    "Zewnętrzny Dyrektor UX": PAGES["Zewnętrzny Dyrektor UX"],
    "Usługi": SERVICES, "Usługi/": SERVICES, "Kontakt": CONTACT, "Start/": HOME, "Start": HOME,
    "Strona główna": HOME, "Artykuły": ARTICLES
  };
  document.querySelectorAll("div, span, p").forEach(function (el) {
    if (el.children.length > 0) return;
    var t = (el.textContent || "").trim();
    if (/^Zobacz wszystkie artykuly/i.test(t)) {
      el.classList.add("km-link-fx");
      el.addEventListener("click", function () { window.location.href = ARTICLES; });
      return;
    }
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

  /* --- 3b. Split buttony (primary): równe segmenty + drift + rolka strzałki --- */
  document.querySelectorAll("div").forEach(function (el) {
    if (el.children.length !== 2) return;
    var main = el.children[0], arrow = el.children[1];
    if (!(arrow.children.length === 1 && arrow.querySelector('svg[data-icon-name="arrow-right"], svg[data-icon-name="arrow_right_alt"]'))) return;
    var mStyle = main.getAttribute("style") || "", aStyle = arrow.getAttribute("style") || "";
    if (!/background-color/.test(mStyle) || !/background-color/.test(aStyle)) return;
    if (!(main.textContent || "").trim()) return;
    el.classList.add("km-splitbtn");
    main.classList.add("km-split-main");
    arrow.classList.add("km-split-arrow");
  });

  /* --- 3c. Przyciski kart „Zobacz usługę" bez dopasowanej nazwy --- */
  document.querySelectorAll('[data-pencil-name*="Frame 707"], [data-pencil-name*="button-secondary"]').forEach(function (el) {
    if (el.classList.contains("km-btn-fx")) return;
    var t = (el.textContent || "").trim();
    if (!/zobacz usługę/i.test(t) || t.length > 40) return;
    el.classList.add("km-btn-fx");
    el.style.cursor = "pointer";
    var target = serviceCardTarget(el);
    el.addEventListener("click", function () { window.location.href = target; });
  });

  /* --- 3d. Stany hover/active — z tablicy „Komponenty — stany" w projekcie Pen --- */
  var STATE_MAP = {
    "rgb(82, 5, 231)": ["#3C00AB", "#1D0055"],
    "rgb(60, 0, 171)": ["#1D0055", "#0D0033"],
    "rgb(46, 16, 101)": ["#1D0055", "#0D0033"],
    "rgb(242, 242, 247)": ["#E9E9F7", "#D4D0F8"],
    "rgb(233, 233, 247)": ["#D4D0F8", "#A399FD"]
  };
  document.querySelectorAll(".km-btn-fx").forEach(function (el) {
    if (el.closest(".km-splitbtn") || el.classList.contains("km-splitbtn")) return;
    var t = (el.textContent || "").trim();
    if (/zobacz usługę/i.test(t)) { el.classList.add("km-cardbtn"); return; }
    var cs = getComputedStyle(el);
    if (/napisz wiadomość|^kontakt$/i.test(t) && cs.backgroundColor === "rgb(255, 255, 255)") {
      el.classList.add("km-linkbtn");
      return;
    }
    var m = STATE_MAP[cs.backgroundColor];
    if (m) {
      el.classList.add("km-btn-state");
      el.style.setProperty("--km-hover", m[0]);
      el.style.setProperty("--km-active", m[1]);
    }
  });

  /* --- 4b. Mega-menu „Usługi" (stan otwarty z projektu Pen) --- */
  (function () {
    var nav = document.querySelector('[data-pencil-name="Nav-top"]');
    if (!nav) return;
    var wrap = document.createElement("div");
    wrap.className = "km-nav-wrap";
    wrap.style.width = "100%";
    wrap.style.alignSelf = "stretch";
    wrap.style.flexShrink = "0";
    nav.parentNode.insertBefore(wrap, nav);
    wrap.appendChild(nav);
    var ITEMS = [
      ["Badania UX", "Pozyskaj wiedzę o użytkownikach i przekuj je w biznes z moją pomocą."],
      ["Zewnętrzny Dyrektor UX", "Oddeleguj zarządzanie doświadczeniami Twoich klientów bez kosztów etatu."],
      ["Segmentacja klientów", "Zrozum, którzy klienci przynoszą największy zysk i jak o nich zadbać."],
      ["Audyt UX", "Zacznij od przeglądu UX w Twoim produkcie na bazie mojej wiedzy i analityki."],
      ["Konsultacje i mentoring", "Indywidualnie przedyskutuj rzeczy lub podnieś swoje kompetencje w UX."],
      ["Wystąpienia i szkolenia", "Zaproś mnie na konferencję lub podnieś kompetencje swojego zespołu."]
    ];
    var rows = [ITEMS.slice(0, 3), ITEMS.slice(3)];
    var mega = document.createElement("div");
    mega.className = "km-mega";
    mega.innerHTML =
      '<div class="km-mega__inner">' +
        '<div class="km-mega__left">' +
          '<div class="km-mega__label">USŁUGI</div>' +
          '<div class="km-mega__title">Wsparcie UX dopasowane do etapu Twojego produktu</div>' +
          '<a class="km-mega__all" href="uslugi.html">Wszystkie usługi ' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>' +
        '</div>' +
        '<div class="km-mega__grid">' +
          rows.map(function (row) {
            return '<div class="km-mega__row">' + row.map(function (it) {
              return '<a class="km-mega__item" href="' + (PAGES[it[0]] || "uslugi.html") + '"><strong>' + it[0] + '</strong><p>' + it[1] + '</p></a>';
            }).join("") + '</div>';
          }).join("") +
        '</div>' +
      '</div>';
    wrap.appendChild(mega);
    var hideT;
    function open() { clearTimeout(hideT); wrap.classList.add("is-open"); }
    function close() { hideT = setTimeout(function () { wrap.classList.remove("is-open"); }, 160); }
    function overButton(t) {
      return !!(t && t.closest && t.closest('.km-btn-fx, [data-pencil-name="Frame 710"]'));
    }
    nav.addEventListener("mouseover", function (e) {
      if (overButton(e.target)) { close(); return; }
      open();
    });
    nav.addEventListener("mouseleave", close);
    mega.addEventListener("mouseenter", open);
    mega.addEventListener("mouseleave", close);
  })();

  /* --- 4d. Animacje talii zdjęć (hero i demo raportu) wg klatek z Pen --- */
  (function () {
    if (reduced) return;
    var EASE = "cubic-bezier(.45,.05,.18,1)", DUR = 1250, LOAD = 3500;

    function getUrl(el) { var m = (el.style.backgroundImage || "").match(/url\(['"]?([^'")]+)['"]?\)/); return m && m[1]; }
    function setUrl(el, u) { el.style.backgroundImage = el.style.backgroundImage.replace(/url\(['"]?[^'")]+['"]?\)/, "url('" + u + "')"); }
    function slotOf(el, addL, addT) { return { l: (addL || 0) + el.offsetLeft, t: (addT || 0) + el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; }
    function geomKf(s) { return { left: s.l + "px", top: s.t + "px", width: s.w + "px", height: s.h + "px" }; }
    function lerpSlot(a, b, t) {
      return { l: a.l + (b.l - a.l) * t, t: a.t + (b.t - a.t) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t };
    }
    var VEIL_BACK = 0.6, VEIL_MID = 0.4, BLUR_BACK = 1, BLUR_MID = 0.5;
    function mkClone(container, url, slot, z) {
      var c = document.createElement("div");
      c.style.cssText = "position:absolute;z-index:" + z + ";background-image:url('" + url + "');background-size:cover;background-position:center;" +
        "left:" + slot.l + "px;top:" + slot.t + "px;width:" + slot.w + "px;height:" + slot.h + "px;";
      var v = document.createElement("div");
      v.style.cssText = "position:absolute;inset:0;background:#ffffff;opacity:0;";
      c.appendChild(v);
      c._veil = v;
      return c;
    }
    function restyleLayer(el, whiteAlpha, blurPx) {
      var u = null;
      var m = (el.style.backgroundImage || "").match(/url\(['"]?([^'")]+)['"]?\)/);
      if (m) u = m[1]; else return;
      el.style.backgroundImage = "linear-gradient(rgba(255,255,255," + whiteAlpha + "), rgba(255,255,255," + whiteAlpha + ")), url('" + u + "')";
      el.style.backgroundSize = "100% 100%, cover";
      el.style.backgroundPosition = "0% 0%, center";
      el.style.backgroundRepeat = "no-repeat, no-repeat";
      el.style.filter = "blur(" + blurPx + "px)";
      el.style.opacity = "1";
    }

    function deckSwap(cfg, done) {
      var uF = getUrl(cfg.front), uM = getUrl(cfg.mid), uB = getUrl(cfg.back);
      var F = cfg.F, M = cfg.M, B = cfg.B;
      var cloneNew = mkClone(cfg.container, uF, B, 0);
      var cloneBack = mkClone(cfg.container, uB, B, 1);
      var cloneIn = mkClone(cfg.container, uM, M, 2);
      var cloneOut = mkClone(cfg.container, uF, F, 2);
      cfg.container.appendChild(cloneNew);
      cfg.container.appendChild(cloneBack);
      cfg.container.appendChild(cloneIn);
      cfg.container.appendChild(cloneOut);
      cfg.front.style.visibility = "hidden";
      cfg.mid.style.visibility = "hidden";
      cfg.back.style.visibility = "hidden";
      var opts = { duration: DUR, easing: EASE, fill: "forwards" };
      cloneIn.animate([
        Object.assign(geomKf(M), { filter: "blur(" + BLUR_MID + "px)" }),
        Object.assign(geomKf(F), { filter: "blur(0px)" })
      ], opts);
      cloneIn._veil.animate([{ opacity: VEIL_MID }, { opacity: 0 }], opts);
      cloneBack.animate([
        Object.assign(geomKf(B), { filter: "blur(" + BLUR_BACK + "px)" }),
        Object.assign(geomKf(M), { filter: "blur(" + BLUR_MID + "px)" })
      ], opts);
      cloneBack._veil.animate([{ opacity: VEIL_BACK }, { opacity: VEIL_MID }], opts);
      var EXIT = { l: F.l + (F.l - M.l) * 0.9, t: F.t + (F.t - M.t) * 0.9, w: F.w * 1.06, h: F.h * 1.06 };
      var ENTRY = { l: B.l + (B.l - M.l) * 0.9, t: B.t + (B.t - M.t) * 0.9, w: B.w * 0.9, h: B.h * 0.9 };
      cloneOut.animate([
        Object.assign(geomKf(F), { opacity: "1", filter: "blur(0px)" }),
        Object.assign(geomKf(lerpSlot(F, EXIT, 0.45)), { opacity: "0.55", offset: 0.45 }),
        Object.assign(geomKf(EXIT), { opacity: "0", filter: "blur(0px)" })
      ], opts);
      cloneNew.animate([
        Object.assign(geomKf(ENTRY), { opacity: "0", filter: "blur(" + BLUR_BACK + "px)" }),
        Object.assign(geomKf(lerpSlot(ENTRY, B, 0.4)), { opacity: "0.4", offset: 0.4 }),
        Object.assign(geomKf(B), { opacity: "1", filter: "blur(" + BLUR_BACK + "px)" })
      ], opts);
      cloneNew._veil.animate([{ opacity: VEIL_BACK }, { opacity: VEIL_BACK }], opts);
      setTimeout(function () {
        setUrl(cfg.front, uM); setUrl(cfg.mid, uB); setUrl(cfg.back, uF);
        cfg.front.style.visibility = "";
        cfg.mid.style.visibility = "";
        cfg.back.style.visibility = "";
        cloneIn.remove(); cloneBack.remove(); cloneOut.remove();
        done();
      }, DUR + 60);
    }

    function armFill(scope) {
      var track = null, fill = null;
      Array.prototype.forEach.call(scope.querySelectorAll("div"), function (el) {
        var cs = getComputedStyle(el);
        if (!track && cs.backgroundColor === "rgb(233, 233, 247)" && el.offsetHeight <= 16) track = el;
        if (!fill && cs.backgroundColor === "rgb(82, 5, 231)" && el.offsetHeight <= 16) fill = el;
      });
      if (!track || !fill) return null;
      var host = track.parentElement === fill.parentElement ? track : track;
      host.style.position = "relative";
      host.appendChild(fill);
      fill.style.left = ""; fill.style.top = ""; fill.style.width = ""; fill.style.height = "";
      fill.classList.add("km-hero-fill");
      return fill;
    }

    function armHover(cfg, state) {
      var els = [cfg.front, cfg.mid, cfg.back];
      els.forEach(function (el) { el.style.transition = "transform .6s cubic-bezier(.22,.61,.36,1)"; });
      var factors = [[10, 8], [3, 2], [-6, -5]];
      cfg.container.addEventListener("mousemove", function (e) {
        if (state.swapping) return;
        var r = cfg.container.getBoundingClientRect();
        var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        els.forEach(function (el, i) {
          el.style.transform = "translate(" + (nx * factors[i][0]).toFixed(1) + "px," + (ny * factors[i][1]).toFixed(1) + "px)" +
            (i === 0 ? " rotate(" + (nx * 0.8).toFixed(2) + "deg)" : "");
        });
        state.hovered = true;
        if (state.fill) state.fill.style.animationPlayState = "paused";
      });
      cfg.container.addEventListener("mouseleave", function () {
        state.hovered = false;
        els.forEach(function (el) { el.style.transform = ""; });
        if (state.fill) state.fill.style.animationPlayState = "";
      });
    }

    function runDeck(cfg, fill) {
      var state = { hovered: false, swapping: false, fill: fill };
      armHover(cfg, state);
      var els = [cfg.front, cfg.mid, cfg.back];
      function attempt() {
        if (document.hidden || state.hovered) { setTimeout(attempt, 400); return; }
        state.swapping = true;
        deckSwap(cfg, function () {
          void els[0].offsetWidth;
          els.forEach(function (el) { el.style.transition = "transform .6s cubic-bezier(.22,.61,.36,1)"; });
          state.swapping = false;
          cycle();
        });
        els.forEach(function (el) { el.style.transition = "none"; el.style.transform = ""; });
      }
      function cycle() {
        if (fill) { fill.style.animationPlayState = ""; fill.classList.remove("is-run"); void fill.offsetWidth; fill.classList.add("is-run"); }
        setTimeout(attempt, LOAD);
      }
      cycle();
    }

    (function heroDeck() {
      var f662 = document.querySelector('[data-pencil-name="Frame 662"]');
      if (!f662) return;
      var photo = f662.firstElementChild;
      if (!photo || !/url\(/.test(photo.style.backgroundImage || "")) return;
      var container = f662.parentElement;
      var abs = Array.prototype.filter.call(container.children, function (el) {
        return el !== f662 && /url\(/.test(el.style.backgroundImage || "");
      });
      if (abs.length < 2) return;
      var backEl = abs[0], midEl = abs[1];
      if (backEl.offsetLeft < midEl.offsetLeft) { var t = backEl; backEl = midEl; midEl = t; }
      restyleLayer(backEl, VEIL_BACK, BLUR_BACK);
      restyleLayer(midEl, VEIL_MID, BLUR_MID);
      var cfg = {
        container: container, front: photo, mid: midEl, back: backEl,
        F: slotOf(photo, f662.offsetLeft, f662.offsetTop), M: slotOf(midEl), B: slotOf(backEl),
        bulgeL: 130, bulgeT: 12
      };
      runDeck(cfg, armFill(f662));
    })();

    (function reportDeck() {
      var container = document.querySelector('[data-pencil-name="animation"]');
      if (!container) return;
      var layers = Array.prototype.filter.call(container.children, function (el) {
        return /url\(/.test(el.style.backgroundImage || "");
      });
      if (layers.length < 3) return;
      layers.sort(function (a, b) { return (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0); });
      var backEl = layers[0], midEl = layers[1], frontEl = layers[2];
      restyleLayer(backEl, VEIL_BACK, BLUR_BACK);
      restyleLayer(midEl, VEIL_MID, BLUR_MID);
      var cfg = {
        container: container, front: frontEl, mid: midEl, back: backEl,
        F: slotOf(frontEl), M: slotOf(midEl), B: slotOf(backEl),
        bulgeL: 0, bulgeT: 95
      };
      var wrap = container.parentElement;
      runDeck(cfg, armFill(wrap));
    })();
  })();


  /* --- 4e. „Jak wygląda współpraca?": scrollowe odsłanianie fali (miękka maska) + aktywacja ikon --- */
  (function () {
    var firstWave = document.querySelector('[data-pencil-name="Wave 1"]');
    if (!firstWave) return;
    var section = firstWave.parentElement;
    var waves = Array.prototype.filter.call(section.children, function (el) {
      return /^Wave/.test(el.getAttribute("data-pencil-name") || "");
    });
    if (!waves.length) return;
    var cols = [];
    var content = section.querySelector('[data-pencil-name="Frame 661"]');
    if (content) {
      var grid = null;
      Array.prototype.forEach.call(content.children, function (el) {
        if (!grid && el.children.length >= 4 && el.offsetHeight > 250) grid = el;
      });
      if (grid) cols = Array.prototype.slice.call(grid.children, 0, 4);
    }
    var rings = section.querySelectorAll('[data-pencil-name="Icon Ring"]');
    if (reduced) return;

    var wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:0;";
    section.insertBefore(wrap, waves[0]);
    waves.forEach(function (w) { wrap.appendChild(w); });
    if (getComputedStyle(section).position === "static") section.style.position = "relative";

    var DIM = [1, 1, 0.8, 0.65];
    var CENTERS = [275, 585, 895, 1205];
    var W0 = 179, W1 = 1620, FEATHER = 170;
    var RAMPS = {
      outer: [0, 0, 0.05, 0.25],
      r673: [0, 0, 0.30, 0.50],
      r674: [0, 0.25, 0.35, 0.80],
      dot: [0, 0, 0.25, 0.90],
      icon: [0.75, 1, 1, 1]
    };
    var ringLayers = Array.prototype.map.call(rings, function (ring) {
      ring.style.outline = "3px solid rgba(255,255,255,0)";
      ring.style.outlineOffset = "-1.5px";
      var f673 = ring.querySelector('[data-pencil-name="Frame 673"]');
      var f674 = ring.querySelector('[data-pencil-name="Frame 674"]');
      if (f673) f673.style.border = "3px solid rgba(255,255,255,0)";
      if (f674) f674.style.border = "3px solid rgba(255,255,255,0)";
      return {
        outer: ring,
        r673: ring.querySelector('[data-pencil-name="Frame 673"]'),
        r674: ring.querySelector('[data-pencil-name="Frame 674"]'),
        dot: ring.querySelector('[data-pencil-name="Frame 672"]'),
        icon: ring.querySelector("svg"),
        glyphs: ring.querySelectorAll("svg path, svg circle, svg rect, svg line, svg polyline")
      };
    });
    function rampVal(r, s) { var i = Math.min(2, Math.floor(s)); var f = s - i; return r[i] + (r[i + 1] - r[i]) * f; }
    function whiteA(a) { return "rgba(255,255,255," + a.toFixed(3) + ")"; }
    function iconColor(s) {
      var t = Math.max(0, Math.min(1, s - 2));
      var r = Math.round(255 + (29 - 255) * t), g = Math.round(255 - 255 * t), b = Math.round(255 + (85 - 255) * t);
      return "rgb(" + r + "," + g + "," + b + ")";
    }
    function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
    function setProgress(p) {
      var w = W0 + (W1 - W0) * p;
      var maskCss = "linear-gradient(90deg, #000 " + Math.max(0, w - FEATHER) + "px, rgba(0,0,0,0) " + w + "px)";
      wrap.style.webkitMaskImage = maskCss;
      wrap.style.maskImage = maskCss;
      cols.forEach(function (col, i) {
        var sp = ease((w - CENTERS[i]) / 220 + 0.5);
        var base = DIM[i];
        col.style.opacity = String(base + (1 - base) * sp);
        var L = ringLayers[i];
        if (!L) return;
        var s = sp * 3;
        L.outer.style.outlineColor = whiteA(rampVal(RAMPS.outer, s));
        if (L.r673) L.r673.style.borderColor = whiteA(rampVal(RAMPS.r673, s));
        if (L.r674) L.r674.style.borderColor = whiteA(rampVal(RAMPS.r674, s));
        if (L.dot) L.dot.style.backgroundColor = whiteA(rampVal(RAMPS.dot, s));
        if (L.icon) L.icon.style.opacity = String(rampVal(RAMPS.icon, s));
        var gc = iconColor(s);
        Array.prototype.forEach.call(L.glyphs, function (g) { g.style.fill = gc; });
      });
    }
    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
    var played = false;
    function playReveal() {
      var t0 = performance.now(), D = 5200;
      function frame(now) {
        var t = Math.min(1, (now - t0) / D);
        setProgress(easeOut(t));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function check() {
      if (played) return;
      var r = section.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.62 && r.bottom > 0) {
        played = true;
        playReveal();
      }
    }
    window.addEventListener("scroll", check, { passive: true });
    setProgress(0);
    check();

    var ctaPanel = null;
    Array.prototype.forEach.call(section.querySelectorAll("div"), function (el) {
      if (!ctaPanel && /^#14053333$/i.test(((el.getAttribute("style") || "").match(/background-color:\s*(#[0-9a-f]{8})/i) || [])[1] || "")) ctaPanel = el;
    });
    if (ctaPanel) ctaPanel.classList.add("km-proc-cta");
  })();

  /* --- 4f. Opinie: never-ending marquee (auto-dryf, pauza na hover, scroll ręczny) --- */
  (function () {
    if (reduced) return;
    var head = null;
    document.querySelectorAll("div").forEach(function (el) {
      if (!head && el.children.length === 0 && (el.textContent || "").trim() === "Co mówią klienci") head = el;
    });
    if (!head) return;
    var scope = head.parentElement;
    var f663 = scope && scope.querySelector('[data-pencil-name="Frame 663"]');
    if (!f663) return;
    var H = f663.offsetHeight, W = f663.offsetWidth, GAP = 20, shift = H + GAP;
    var vp = document.createElement("div");
    vp.style.cssText = "overflow:hidden;height:" + H + "px;width:" + W + "px;position:relative;";
    f663.parentNode.insertBefore(vp, f663);
    var track = document.createElement("div");
    track.style.cssText = "display:flex;flex-direction:column;gap:" + GAP + "px;will-change:transform;";
    vp.appendChild(track);
    track.appendChild(f663);
    track.appendChild(f663.cloneNode(true));
    var pos = -shift, hovered = false, last = performance.now();
    var SPEED = shift / 52;
    function wrapPos() {
      while (pos >= 0) pos -= shift;
      while (pos < -shift) pos += shift;
    }
    function frame(now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!hovered) { pos += SPEED * dt; wrapPos(); }
      track.style.transform = "translateY(" + pos + "px)";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    vp.addEventListener("mouseenter", function () { hovered = true; });
    vp.addEventListener("mouseleave", function () { hovered = false; });
    vp.addEventListener("wheel", function (e) {
      e.preventDefault();
      pos -= e.deltaY;
      wrapPos();
      track.style.transform = "translateY(" + pos + "px)";
    }, { passive: false });
  })();

  /* --- 4g. Tooltip przy kursorze na „Pobierz Demo Raportu" --- */
  (function () {
    var btns = [];
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length !== 0 || !/^pobierz demo raportu$/i.test((el.textContent || "").trim())) return;
      var b = el;
      for (var i = 0; i < 4 && b; i++) {
        if (/background-color/.test(b.getAttribute("style") || "")) { btns.push(b); return; }
        b = b.parentElement;
      }
    });
    if (!btns.length) return;
    btns.forEach(function (b) { b.classList.add("km-btn-fx"); });
    var tip = document.createElement("div");
    tip.className = "km-dl-tip";
    tip.textContent = "Po kliknięciu rozpocznie się pobieranie";
    document.body.appendChild(tip);
    function zoom() { return parseFloat(document.body.style.zoom) || 1; }
    btns.forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var z = zoom();
        tip.style.left = (e.clientX / z) + "px";
        tip.style.top = (e.clientY / z - 34) + "px";
        tip.classList.add("is-on");
      });
      b.addEventListener("mouseleave", function () { tip.classList.remove("is-on"); });
    });
  })();

  /* --- 4h. Newsletter: działający input + zapis --- */
  (function () {
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length !== 0 || (el.textContent || "").trim() !== "Wpisz swój adres e-mail") return;
      var box = el.parentElement;
      var input = document.createElement("input");
      input.type = "email";
      input.placeholder = "Wpisz swój adres e-mail";
      input.className = "km-nl-input";
      el.replaceWith(input);
      box.style.cursor = "text";
      box.addEventListener("click", function () { input.focus(); });
      var row = box.parentElement;
      var btn = Array.prototype.find.call(row.children, function (c) { return /zapisz się/i.test(c.textContent || ""); });
      function submit() {
        var v = input.value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
          input.classList.add("is-bad");
          input.focus();
          setTimeout(function () { input.classList.remove("is-bad"); }, 1200);
          return;
        }
        row.style.transition = "opacity .3s ease";
        row.style.opacity = "0";
        setTimeout(function () {
          row.innerHTML = '<div class="km-nl-ok">Dzięki! Sprawdź skrzynkę i potwierdź zapis ✨</div>';
          row.style.opacity = "1";
        }, 300);
      }
      if (btn) btn.addEventListener("click", submit);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    });
  })();

  /* --- 4i. Historie klientów: karuzela case study + gradientowe przejęcie sekcji --- */
  (function () {
    var head = null;
    document.querySelectorAll("div").forEach(function (el) {
      if (!head && el.children.length === 0 && (el.textContent || "").trim() === "Kilka historii moich klientów") head = el;
    });
    if (!head) return;
    var sec = head.parentElement, secBg = null;
    while (sec) {
      var st = sec.getAttribute("style") || "";
      if (/background-color/.test(st) && sec.offsetWidth >= 1400) { secBg = sec; break; }
      if (sec.offsetWidth >= 1400 && !secBg) secBg = sec;
      sec = sec.parentElement;
    }
    sec = secBg;
    if (!sec) return;
    var title = null, desc = null, tag = null, paras = [];
    sec.querySelectorAll("div").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (t.indexOf("7 KONCEPCJI") === 0 && !el.querySelector("div")) title = el;
      if (!desc && el.children.length === 0 && /Badania RITE/.test(t)) desc = el;
      if (!tag && el.children.length === 0 && t.indexOf("CASE /") === 0) tag = el;
      if (el.children.length === 0 && /Dlatego nie dostarczam raportów/.test(t)) paras.push(el);
    });
    if (!title || !desc || !tag) return;
    var leftPanel = title;
    while (leftPanel && !/linear-gradient/.test(leftPanel.getAttribute("style") || "")) leftPanel = leftPanel.parentElement;
    var cardRow = leftPanel ? leftPanel.parentElement : null;
    if (!cardRow) return;
    var rightPara = null, lead = null;
    paras.forEach(function (el) {
      if (cardRow.contains(el)) rightPara = el; else lead = el;
    });

    var rightPanel = Array.prototype.find.call(cardRow.children, function (el) {
      return /background-color:\s*#FFFFFF/i.test(el.getAttribute("style") || "");
    });
    cardRow.style.alignItems = "stretch";
    if (rightPanel) {
      rightPanel.style.height = "auto";
      rightPanel.style.justifyContent = "space-between";
      var linkWrap = null;
      rightPanel.querySelectorAll("div").forEach(function (el) {
        if (!linkWrap && /Przeczytaj historię projektu/.test(el.textContent || "")) {
          var w = el;
          while (w.parentElement !== rightPanel) w = w.parentElement;
          linkWrap = w;
        }
      });
      if (linkWrap) {
        linkWrap.style.alignSelf = "flex-end";
        linkWrap.style.marginTop = "auto";
      }
    }

    sec.style.position = "relative";
    Array.prototype.forEach.call(sec.children, function (ch) {
      var cs = getComputedStyle(ch);
      if (cs.position === "static") ch.style.position = "relative";
      if (!ch.style.zIndex) ch.style.zIndex = "1";
    });
    var overlay = document.createElement("div");
    overlay.className = "km-case-overlay";
    sec.insertBefore(overlay, sec.firstChild);
    [head, lead].forEach(function (el) { if (el) el.classList.add("km-case-text"); });
    var state = { hover: false };
    var fill = null;
    var f701 = sec.querySelector('[data-pencil-name="Frame 701"]');
    if (f701) {
      Array.prototype.forEach.call(f701.children, function (el) {
        var st = el.getAttribute("style") || "";
        if (/background-color:\s*#5205E7/i.test(st)) fill = el;
      });
      if (fill) {
        f701.style.position = "relative";
        fill.style.left = ""; fill.style.top = ""; fill.style.width = ""; fill.style.height = "";
        fill.classList.add("km-hero-fill");
      }
    }
    cardRow.addEventListener("mouseenter", function () {
      sec.classList.add("km-case-on");
      state.hover = true;
      if (fill) fill.style.animationPlayState = "paused";
    });
    cardRow.addEventListener("mouseleave", function () {
      sec.classList.remove("km-case-on");
      state.hover = false;
      if (fill) fill.style.animationPlayState = "";
    });

    var CASES = [
      { title: "7 KONCEPCJI\n14 DNI.", desc: "Badania RITE: szybka walidacja siedmiu koncepcji procesu. Efekty nie wymagają zmian od kilku lat.", tag: "CASE / APTEKA GEMINI", right: "Dlatego nie dostarczam raportów do szuflady: pokazuję, gdzie tracisz pieniądze w doświadczeniu klienta i co zrobić, żeby je odzyskać." },
      { title: "MILISEKUNDY\n= PIENIĄDZE.", desc: "Optymalizacja krytycznych ścieżek na podstawie badań i twardych danych analitycznych.", tag: "CASE / XTB", right: "Szybkość interfejsu przełożona wprost na wynik finansowy — badania wskazały, które ścieżki naprawdę bolą użytkowników." },
      { title: "SEGMENTACJA\nPORZĄDKUJE.", desc: "Połączenie danych behawioralnych z wywiadami pogłębionymi w jedną mapę segmentów.", tag: "CASE / OLX", right: "Segmentacja, która uporządkowała roadmapę: zespół skupił się na segmentach o największym potencjale wzrostu." }
    ];
    var idx = 0;
    if (reduced) return;
    var SLIDE = 700, EASECR = "cubic-bezier(.45,.05,.2,1)";
    function setCase(c) {
      title.innerText = c.title;
      desc.innerText = kmNbsp(c.desc);
      tag.innerText = c.tag;
      if (rightPara) rightPara.innerText = kmNbsp(c.right);
    }
    function advance() {
      if (document.hidden || state.hover) { setTimeout(advance, 400); return; }
      idx = (idx + 1) % CASES.length;
      var parent = cardRow.parentElement;
      if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
      var clone = cardRow.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = cardRow.offsetLeft + "px";
      clone.style.top = cardRow.offsetTop + "px";
      clone.style.width = cardRow.offsetWidth + "px";
      clone.style.zIndex = "2";
      clone.style.transition = "transform " + SLIDE + "ms " + EASECR + ", opacity " + SLIDE + "ms ease";
      parent.appendChild(clone);
      setCase(CASES[idx]);
      cardRow.style.transition = "none";
      cardRow.style.transform = "translateX(-90px)";
      cardRow.style.opacity = "0";
      void cardRow.offsetWidth;
      cardRow.style.transition = "transform " + SLIDE + "ms " + EASECR + ", opacity " + SLIDE + "ms ease";
      cardRow.style.transform = "";
      cardRow.style.opacity = "1";
      clone.style.transform = "translateX(110px)";
      clone.style.opacity = "0";
      setTimeout(function () { clone.remove(); cycle(); }, SLIDE + 40);
    }
    function cycle() {
      if (fill) { fill.style.animationPlayState = ""; fill.classList.remove("is-run"); void fill.offsetWidth; fill.classList.add("is-run"); }
      setTimeout(advance, 3500);
    }
    cycle();
  })();

  /* --- 4c. Pływający widżet kalendarza — stały do sekcji „Co mówią klienci" --- */
  (function () {
    var OFFER_PAGE = /(badania-ux|segmentacja-klientow|audyt-ux|konsultacje-i-mentoring|dyrektor-ux|wystapienia-i-szkolenia)\.html$/;
    var existing = document.querySelector('[data-pencil-name="div - float"]');
    if (!OFFER_PAGE.test(location.pathname)) {
      if (existing) existing.style.display = "none";
      return;
    }
    var float = existing;
    if (!float) {
      float = document.createElement("div");
      float.setAttribute("data-pencil-name", "div - float");
      float.style.cssText = "align-items:flex-start;backdrop-filter:blur(6px);background-color:#ffffff80;border:1px solid #E9E9F7;box-sizing:border-box;display:flex;flex-direction:column;gap:0;height:fit-content;padding:20px;width:fit-content;";
      float.innerHTML =
        '<div style="align-items:flex-start;box-sizing:border-box;display:flex;flex-direction:column;gap:20px;height:fit-content;justify-content:flex-end;width:358px">' +
          '<div style="align-items:center;background-color:#fafafa;box-sizing:border-box;display:flex;flex-direction:column;gap:22.4px;height:fit-content;padding:80px 24px;width:100%">' +
            '<div style="box-sizing:border-box;color:#3a3d52;font-family:Inter,system-ui,sans-serif;font-size:17px;font-weight:400;line-height:27px;text-align:center;width:100%">Tu pojawi się widżet rezerwacji terminu. Wklej swój link Calendly lub Cal.com w pliku js/main.js (CONFIG.calendarUrl).</div>' +
          '</div>' +
          '<div style="box-sizing:border-box;color:#3a3d52;font-family:Nexa,system-ui,sans-serif;font-size:16px;font-weight:400;line-height:1.3;text-align:right;width:100%">Wystarczy kliknąć<br>w kalendarz :)</div>' +
        '</div>';
    }
    document.body.appendChild(float);
    float.classList.add("km-cal-float");
    float.addEventListener("click", function () { window.location.href = CONTACT; });

    var target = null;
    document.querySelectorAll("div").forEach(function (el) {
      if (!target && el.children.length === 0 && (el.textContent || "").trim() === "Co mówią klienci") target = el;
    });
    if (target) {
      var sec = target;
      for (var i = 0; i < 5 && sec.parentElement; i++) {
        sec = sec.parentElement;
        if ((sec.getAttribute("data-pencil-name") || "") === "section" || sec.offsetHeight > 600) break;
      }
      target = sec;
    }
    if (!target) {
      var pool = document.querySelector('[data-pencil-name="main"]') || document.body.firstElementChild;
      target = pool ? pool.lastElementChild : null;
    }
    var hero = document.querySelector('[data-pencil-name="section"]');
    float.classList.add("is-hidden");
    function syncFloat() {
      var f = float.getBoundingClientRect();
      var afterHero = true;
      if (hero) afterHero = hero.getBoundingClientRect().bottom < Math.max(f.top, 60);
      var beforeEnd = true;
      if (target) beforeEnd = target.getBoundingClientRect().top > f.bottom + 40;
      float.classList.toggle("is-hidden", !(afterHero && beforeEnd));
    }
    window.addEventListener("scroll", syncFloat, { passive: true });
    window.addEventListener("resize", syncFloat);
    syncFloat();
  })();

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
