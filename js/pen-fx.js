/* Mikrointerakcje na eksportach z pen.dev — porty animacji z krzysztof-miotk/js/main.js */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 0. Pełna szerokość ekranu: skala proporcjonalna + marginesy 140px ≥1480px.
         Poniżej 768px: tryb mobilny — baza 430px + linearyzacja layoutu (0b). --- */
  var MOBILE_BP = 768, MBASE = 430;
  var isMob = document.documentElement.clientWidth < MOBILE_BP;
  (function () {
    var root = document.body.firstElementChild;
    if (!root) return;
    if (!root.getAttribute("data-pencil-name")) {
      var page = null;
      Array.prototype.forEach.call(root.children, function (k) {
        if (k.tagName !== "DIV" || getComputedStyle(k).position !== "absolute") return;
        if (k.offsetWidth >= 1200 && (!page || k.offsetWidth > page.offsetWidth)) page = k;
      });
      if (page) {
        Array.prototype.forEach.call(root.children, function (k) {
          if (k !== page) k.style.display = "none";
        });
        page.style.position = "relative";
        page.style.left = "0";
        page.style.top = "0";
        root.style.width = "auto";
        root.style.height = "auto";
        root = page;
      }
    }
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
      if ((w < MOBILE_BP) !== isMob) { location.reload(); return; }
      if (isMob) { document.body.style.zoom = w / MBASE; return; }
      if (padEls === null) collectPads();
      var wide = w >= 1480;
      padEls.forEach(function (el) {
        el.style.paddingLeft = wide ? "140px" : "100px";
        el.style.paddingRight = wide ? "140px" : "100px";
      });
      document.body.style.zoom = w / designW;
    }
    if (isMob) { kmMobilize(); document.body.classList.add("km-mob"); kmMobilizeWrap(); kmMobileNav(); }
    fit();
    if (isMob) requestAnimationFrame(function () { kmMobilizeWrap(); });
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fit, 80); });
  })();

  /* --- 0b. Tryb mobilny: linearyzacja eksportu 1440px do jednej kolumny ~430px.
         Wiersze flex układane w kolumnę, stałe szerokości i paddingi klamrowane,
         „kanwy" z absolutnie pozycjonowanymi dziećmi pomniejszane w całości (zoom). --- */
  var kmCanvases = [];
  function kmMobilize() {
    var MAXW = MBASE, PAD = 20, CONTENT = MAXW - 2 * PAD;
    document.querySelectorAll("body div").forEach(function (el) {
      if (el.children.length !== 1) return;
      var h = /px/.test(el.style.height || "") ? parseFloat(el.style.height) : 0;
      if (!h || h > 100 || getComputedStyle(el).position !== "relative") return;
      var kid = el.firstElementChild;
      if (kid.tagName !== "DIV") return;
      var kcs = getComputedStyle(kid);
      if (kcs.position !== "absolute" || kcs.display !== "flex") return;
      kid.style.position = "static";
      kid.style.left = "";
      kid.style.top = "";
      kid.style.transform = "none";
      el.style.height = "auto";
      el.style.width = "auto";
    });
    document.querySelectorAll("body div").forEach(function (el) {
      if (el.offsetWidth < 1200) return;
      var kids = Array.prototype.filter.call(el.children, function (k) { return k.tagName === "DIV"; });
      if (kids.length < 2) return;
      var abs = kids.filter(function (k) { return getComputedStyle(k).position === "absolute"; });
      if (abs.length !== kids.length) return;
      el.style.height = "auto";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.gap = "28px";
      el.style.padding = "40px 20px";
      kids.forEach(function (k) { k.style.position = "static"; k.style.left = ""; k.style.top = ""; });
    });
    var divs = Array.prototype.slice.call(document.querySelectorAll("body div"));
    var meta = [];
    divs.forEach(function (el) {
      var cs = getComputedStyle(el);
      var kids = Array.prototype.filter.call(el.children, function (k) {
        if (/^Wave/.test(k.getAttribute && k.getAttribute("data-pencil-name") || "")) return false;
        return k.tagName === "DIV" || k.tagName === "IMG" || k.tagName === "svg";
      });
      meta.push({
        el: el, w: el.offsetWidth, kids: kids,
        display: cs.display, dir: cs.flexDirection, pos: cs.position,
        padL: parseFloat(cs.paddingLeft) || 0, padR: parseFloat(cs.paddingRight) || 0,
        nowrap: cs.whiteSpace === "nowrap", inlineW: /px/.test(el.style.width || "") ? parseFloat(el.style.width) : 0,
        inlineH: /px/.test(el.style.height || "") ? parseFloat(el.style.height) : 0,
        kidW: kids.map(function (k) { return k.offsetWidth; }),
        kidAbs: kids.filter(function (k) { return getComputedStyle(k).position === "absolute"; }).length
      });
    });
    var canvases = [];
    meta.forEach(function (m) {
      if (m.w <= CONTENT || m.kids.length < 2) return;
      if (m.kidAbs >= 2 && m.kidAbs >= m.kids.length - 1) canvases.push(m.el);
    });
    canvases = canvases.filter(function (c) {
      return !canvases.some(function (o) { return o !== c && o.contains(c); });
    });
    kmCanvases = canvases;
    function inCanvas(el) {
      return canvases.some(function (c) { return c === el || c.contains(el); });
    }
    canvases.forEach(function (c) {
      c.style.zoom = Math.min(1, CONTENT / c.offsetWidth);
    });
    /* Typografia mobile wg projektu Pen (Mobile — Strona główna):
       hero 56→40, nagłówki 40→32, tytuły kart 32→24, kroki 36→28, duże liczby →64 */
    document.querySelectorAll("body div").forEach(function (el) {
      if (el.children.length || inCanvas(el)) return;
      var st = el.getAttribute("style") || "";
      var fm = /font-size:\s*([\d.]+)px/.exec(st);
      if (!fm) return;
      var f = parseFloat(fm[1]);
      var nf = null;
      if (f >= 100) nf = 28;
      else if (f >= 56) nf = 40;
      else if (f >= 46) nf = 36;
      else if (f >= 40) nf = 32;
      else if (f >= 34) nf = 28;
      else if (f >= 30) nf = 24;
      if (!nf || nf >= f) return;
      var ratio = nf / f;
      el.style.fontSize = nf + "px";
      var lh = /line-height:\s*([\d.]+)px/.exec(st);
      if (lh) el.style.lineHeight = Math.round(parseFloat(lh[1]) * ratio) + "px";
      var ls = /letter-spacing:\s*(-?[\d.]+)px/.exec(st);
      if (ls) el.style.letterSpacing = (Math.round(parseFloat(ls[1]) * ratio * 100) / 100) + "px";
    });
    /* statystyki (liczba + opis): wiersz z liczbą 28px/120px — wg projektu mobile */
    document.querySelectorAll("body div").forEach(function (el) {
      if (el.children.length || inCanvas(el)) return;
      var t = (el.textContent || "").replace(/ /g, " ").trim();
      if (!/^#?\d[\d\s]*(?:[–-]\s*\d[\d\s]*)?(?:\+|tyg\.)?$/.test(t)) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 30) return;
      var cell = el.parentElement;
      if (!cell || cell.children.length !== 2) return;
      el.style.fontSize = "28px";
      el.style.lineHeight = "34px";
      el.style.width = "120px";
      el.style.flexShrink = "0";
      el.style.whiteSpace = "nowrap";
      cell.style.display = "flex";
      cell.style.flexDirection = "row";
      cell.style.alignItems = "flex-start";
      cell.style.gap = "16px";
      cell.style.height = "auto";
    });
    meta.forEach(function (m) {
      if (inCanvas(m.el)) return;
      if (m.padL >= 60) m.el.style.paddingLeft = PAD + "px";
      if (m.padR >= 60) m.el.style.paddingRight = PAD + "px";
      /* sekcje pełnej szerokości: pionowe paddingi wg projektu mobile (40–56) */
      if (m.w >= 1200) {
        var cs2 = getComputedStyle(m.el);
        var pt = parseFloat(cs2.paddingTop) || 0, pb = parseFloat(cs2.paddingBottom) || 0;
        if (pt >= 72) m.el.style.paddingTop = "56px"; else if (pt >= 48) m.el.style.paddingTop = "40px";
        if (pb >= 72) m.el.style.paddingBottom = "56px"; else if (pb >= 48) m.el.style.paddingBottom = "40px";
      }
    });
    meta.forEach(function (m) {
      if (inCanvas(m.el)) return;
      if (m.display !== "flex" || m.dir !== "row" || m.w < 560) return;
      var big = m.kidW.filter(function (w) { return w >= 150; }).length;
      if (big < 2) return;
      /* statystyki: liczba + opis zostają w wierszu (wg projektu mobile) */
      var k0 = m.kids[0];
      if (k0 && k0.children && k0.children.length === 0 && /^#?\d[\d\s ]*(?:[–-]\s*\d[\d\s ]*)?(?:\+|tyg\.)?$/.test((k0.textContent || "").trim())) {
        m.el.style.alignItems = "flex-start";
        k0.style.width = "120px";
        k0.style.flexShrink = "0";
        return;
      }
      m.el.style.flexDirection = "column";
      m.el.style.alignItems = "stretch";
      m.el.style.height = "auto";
      m.el.style.rowGap = getComputedStyle(m.el).columnGap;
    });
    meta.forEach(function (m) {
      if (inCanvas(m.el)) return;
      if (m.w > CONTENT || m.inlineW > CONTENT) {
        if (m.el.style.width) m.el.style.width = "auto";
        m.el.style.maxWidth = "100%";
        m.el.style.minWidth = "0";
        m.el.style.boxSizing = "border-box";
      }
      if (m.inlineH >= 300 && m.el.offsetWidth > 200) m.el.style.height = "auto";
      if (!m.el.children.length && m.nowrap && m.w > CONTENT - 40) m.el.style.whiteSpace = "normal";
    });
    document.querySelectorAll("img").forEach(function (im) {
      if (inCanvas(im.parentElement || im)) return;
      if (im.offsetWidth > CONTENT) { im.style.maxWidth = "100%"; im.style.height = "auto"; }
    });
  }

  /* --- 0c. Mobilny nav wg komponentu Pen „Nav-mobile": logo + hamburger, sticky --- */
  function kmMobileNav() {
    var nav = document.querySelector('[data-pencil-name="Nav-top"]');
    if (!nav || nav._kmMob) return;
    nav._kmMob = 1;
    var logo = nav.querySelector('[data-pencil-name*="Logo"], [data-pencil-name="Layer_1"]');
    Array.prototype.forEach.call(nav.children, function (k) {
      if (!logo || !k.contains(logo)) k.style.display = "none";
    });
    nav.style.display = "flex";
    nav.style.flexDirection = "row";
    nav.style.justifyContent = "space-between";
    nav.style.alignItems = "center";
    nav.style.width = "100%";
    nav.style.height = "auto";
    nav.style.padding = "16px 20px";
    nav.style.position = "sticky";
    nav.style.top = "0";
    nav.style.zIndex = "80";
    nav.style.background = "#ffffff";
    var btn = document.createElement("button");
    btn.className = "km-burger";
    btn.setAttribute("aria-label", "Menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#15172C" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    nav.appendChild(btn);
    var panel = document.createElement("div");
    panel.className = "km-mobnav";
    [["Strona główna", "index.html"], ["Moja Oferta", "uslugi.html"], ["Case Study", "case-studies.html"], ["Artykuły", "artykuly.html"], ["Kontakt", "kontakt.html"]].forEach(function (l) {
      var a = document.createElement("a");
      a.href = l[1];
      a.textContent = l[0];
      panel.appendChild(a);
    });
    var cta = document.createElement("a");
    cta.href = "kontakt.html";
    cta.textContent = "Umów darmową rozmowę";
    cta.className = "km-mobnav-cta";
    panel.appendChild(cta);
    nav.parentNode.insertBefore(panel, nav.nextSibling);
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* kroki procesu: ikona po lewej, treść po prawej (wg projektu mobile) */
    document.querySelectorAll('[data-pencil-name="Icon Ring"]').forEach(function (ring) {
      var step = ring.parentElement;
      if (!step || step.children.length !== 2) return;
      step.style.display = "flex";
      step.style.flexDirection = "row";
      step.style.alignItems = "flex-start";
      step.style.gap = "20px";
      ring.style.flexShrink = "0";
    });
    /* hero bez kolażu zdjęć + kalendarz bez zdjęcia i logo (wg projektu mobile) */
    var colPhoto = document.querySelector('div[style*="image-2.jpg"], div[style*="image-2.png"]');
    if (colPhoto && colPhoto.parentElement) colPhoto.parentElement.style.display = "none";
    var calPhoto = document.querySelector('div[style*="image-6.png"]');
    if (calPhoto) {
      calPhoto.style.display = "none";
      var sib = calPhoto.nextElementSibling;
      if (sib && sib.getAttribute("data-pencil-name") === "Logo-short-white") sib.style.display = "none";
    }
    /* stopka: dolny pasek (logo + copyright) w kolumnę, bez nachodzenia */
    document.querySelectorAll("div").forEach(function (bar) {
      var st = bar.getAttribute("style") || "";
      if (!/background-color:\s*(#1D0055|rgb\(29,\s*0,\s*85\))/i.test(st)) return;
      if (!/polityka prywatno/i.test(bar.textContent || "")) return;
      bar.style.position = "static";
      bar.style.display = "flex";
      bar.style.flexDirection = "column";
      bar.style.alignItems = "flex-start";
      bar.style.gap = "18px";
      bar.style.height = "auto";
      bar.style.width = "100%";
      bar.style.padding = "20px";
      Array.prototype.forEach.call(bar.children, function (k) {
        if (getComputedStyle(k).position === "absolute") {
          k.style.position = "relative";
          k.style.left = "";
          k.style.top = "";
        }
      });
    });
  }

  function kmMobilizeWrap() {
    document.querySelectorAll("body div").forEach(function (el) {
      if (el.closest && el.closest(".km-logos-vp")) return;
      if (kmCanvases.some(function (c) { return c === el || c.contains(el); })) return;
      if (el.scrollWidth <= el.clientWidth + 4) return;
      if (!el.querySelector("div")) {
        el.style.whiteSpace = "normal";
        el.style.height = "auto";
        return;
      }
      if (getComputedStyle(el).display === "flex") {
        el.style.flexWrap = "wrap";
        el.style.height = "auto";
      }
    });
  }

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

  /* --- 1c. Hero: logosy klientów — pozioma taśma (prawo→lewo, hover pauza) --- */
  (function () {
    if (reduced) return;
    var label = null;
    document.querySelectorAll("div").forEach(function (el) {
      if (!label && el.children.length === 0 && /^PRACOWAŁEM Z:/.test((el.textContent || "").trim())) label = el;
    });
    if (!label) return;
    var wrapRow = label.parentElement;
    var row = null;
    Array.prototype.forEach.call(wrapRow.children, function (el) {
      if (el !== label && el.querySelectorAll("div").length >= 5) row = el;
    });
    if (!row) return;
    var gap = getComputedStyle(row).columnGap || "32px";
    var vp = document.createElement("div");
    vp.className = "km-logos-vp";
    vp.style.cssText = isMob
      ? "overflow:hidden;width:100%;max-width:100%;flex:0 0 auto;position:relative;"
      : "overflow:hidden;width:660px;max-width:660px;flex:0 0 auto;position:relative;";
    row.parentNode.insertBefore(vp, row);
    var track = document.createElement("div");
    track.style.cssText = "display:flex;align-items:center;gap:" + gap + ";width:max-content;will-change:transform;";
    vp.appendChild(track);
    track.appendChild(row);
    if (isMob) { row.style.flexWrap = "nowrap"; row.style.width = "max-content"; }
    row.style.flexShrink = "0";
    var clone = row.cloneNode(true);
    clone.style.flexShrink = "0";
    track.appendChild(clone);
    var pos = 0, hovered = false, last = performance.now(), SPEED = 30;
    function frame(now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!hovered) {
        pos -= SPEED * dt;
        var w = row.offsetWidth + parseFloat(gap);
        if (-pos >= w) pos += w;
        track.style.transform = "translateX(" + pos + "px)";
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    vp.addEventListener("mouseenter", function () { hovered = true; });
    vp.addEventListener("mouseleave", function () { hovered = false; });
  })();

  /* --- 1d. Statystyki: liczby kalkulują się przy wejściu w widok --- */
  (function () {
    var items = [];
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length) return;
      var t = (el.textContent || "").trim();
      if (!/^#?\d[\d\s\u00A0]*(?:[–-]\s*\d[\d\s\u00A0]*)?(?:\+|tyg\.)?$/.test(t)) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 34) return;
      items.push({ el: el, tpl: t, done: false });
    });
    if (!items.length) return;
    function run(it) {
      it.done = true;
      if (reduced || document.hidden) { it.el.textContent = it.tpl; return; }
      var t0 = performance.now(), D = 1400;
      function fr(now) {
        var t = Math.min(1, (now - t0) / D);
        var k = 1 - Math.pow(1 - t, 3);
        it.el.textContent = it.tpl.replace(/\d+/g, function (num) {
          return String(Math.round(parseInt(num, 10) * k));
        });
        if (t < 1) requestAnimationFrame(fr); else it.el.textContent = it.tpl;
      }
      requestAnimationFrame(fr);
    }
    function check() {
      items.forEach(function (it) {
        if (it.done) return;
        var r = it.el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.88 && r.bottom > 0) run(it);
      });
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
    setTimeout(check, 600);
  })();

  /* --- 2. Karty i wiersze — glow za kursorem + lift --- */
  var cardSel = [
    '[data-pencil-name*="Card"]', '[data-pencil-name*="card"]',
    '[data-pencil-name*="Services Row"]',
    '[data-pencil-name*="Frame 707"]'
  ].join(",");
  function kmColoredBg(el) {
    var n = el.parentElement;
    for (var i = 0; i < 6 && n && n !== document.body; i++) {
      var st = n.getAttribute("style") || "";
      if (/linear-gradient|radial-gradient|background-image:\s*url\(/.test(st)) return true;
      n = n.parentElement;
    }
    return false;
  }
  document.querySelectorAll(cardSel).forEach(function (card) {
    if (card.offsetWidth < 120 || card.offsetHeight < 60) return;
    if (kmColoredBg(card)) {
      var panel = card, pn = card;
      for (var i = 0; i < 3 && pn && pn !== document.body; i++) {
        if (/background-color:\s*(#|rgb)/.test(pn.getAttribute("style") || "")) { panel = pn; break; }
        pn = pn.parentElement;
      }
      panel.classList.add("km-metal-fx");
      return;
    }
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
  var CONTACT = "kontakt.html", SERVICES = "uslugi.html", HOME = "index.html", ARTICLES = "artykuly.html", CASESTUDIES = "case-studies.html";
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
    if (el.closest('[data-pencil-name="form"]')) return;
    var style = el.getAttribute("style") || "";
    if (!/background/.test(style) && !/border/.test(style)) return;
    if (el.offsetHeight < 30 || el.offsetHeight > 90) return;
    el.classList.add("km-btn-fx");
    if (/background-color:\s*#ffffff/i.test(style) && !/border(?!-box)|outline/i.test(style)) el.classList.add("km-metal-under");
    var target = buttonTarget(el);
    el.addEventListener("click", function (e) {
      if (!reduced && !el.classList.contains("km-metal-under")) {
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

  /* --- 3e. Przyciski na jasnym tle — hover z gradientem sekcji usług --- */
  document.querySelectorAll("div").forEach(function (el) {
    var st = el.getAttribute("style") || "";
    if (!/background-color:\s*#f2f2f7/i.test(st)) return;
    if (el.offsetHeight < 30 || el.offsetHeight > 90) return;
    if (!el.querySelector("svg")) return;
    el.classList.add("km-grad-btn");
    if (/Umów darmową rozmowę/.test((el.textContent || "").replace(/\u00A0/g, " "))) el.classList.add("km-grad-primary");
  });

  /* --- 3f. Przyciski na ciemnym półprzezroczystym tle — jasny metaliczny border na hover --- */
  document.querySelectorAll('div[style*="#1a064f86" i]').forEach(function (el) {
    if (el.offsetHeight < 30 || el.offsetHeight > 90) return;
    if (!el.querySelector("svg")) return;
    el.classList.add("km-metal-fx");
  });

  /* --- 3g. Strzałki w przyciskach — rolka jak w hero CTA --- */
  document.querySelectorAll('svg[data-icon-name="arrow-right"]').forEach(function (svg) {
    if (svg.classList.contains("km-case-arrow") || svg.closest(".km-split-arrow")) return;
    var btn = svg.closest(".km-btn-fx, .km-grad-btn, .km-metal-under, .km-metal-fx");
    if (!btn) {
      var n = svg.parentElement;
      for (var i = 0; i < 3 && n; i++) {
        var st = n.getAttribute("style") || "";
        if (/background-color/.test(st) && n.offsetHeight >= 30 && n.offsetHeight <= 90) { btn = n; break; }
        n = n.parentElement;
      }
    }
    if (!btn) return;
    var cs = getComputedStyle(svg);
    var wrap = document.createElement("span");
    wrap.className = "km-roll-wrap";
    wrap.style.width = cs.width;
    wrap.style.height = cs.height;
    svg.parentNode.insertBefore(wrap, svg);
    wrap.appendChild(svg);
    btn.classList.add("km-roll-btn");
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
    "Strona główna": HOME, "Artykuły": ARTICLES, "Artykuły/": ARTICLES,
    "Case studies": CASESTUDIES, "Case studies/": CASESTUDIES,
    "Moja Oferta": SERVICES, "Case Study": CASESTUDIES
  };
  document.querySelectorAll("div, span, p").forEach(function (el) {
    if (el.children.length > 0) return;
    var t = (el.textContent || "").replace(/ /g, " ").trim();
    if (/^Zobacz wszystkie artyku/i.test(t)) {
      el.classList.add("km-link-fx");
      el.addEventListener("click", function () { window.location.href = ARTICLES; });
      return;
    }
    if (/^Zobacz case study$/i.test(t) && !/case-studies\.html/.test(location.pathname)) {
      el.classList.add("km-link-fx");
      el.addEventListener("click", function () { window.location.href = CASESTUDIES; });
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
    if (isMob) return;
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
        cloneIn.remove(); cloneBack.remove(); cloneOut.remove(); cloneNew.remove();
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
    if (isMob) return;
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
    var target = 0, current = 0, rafId = null, synced = false;
    function calcTarget() {
      var r = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.92, end = vh * 0.10;
      var t = (start - r.top) / (start - end);
      return Math.max(0, Math.min(1, t));
    }
    function tick() {
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.002) current = target;
      setProgress(current);
      rafId = current !== target ? requestAnimationFrame(tick) : null;
    }
    function sync() {
      target = calcTarget();
      if (!synced || document.hidden) {
        synced = true;
        current = target;
        setProgress(current);
        return;
      }
      if (rafId === null && target !== current) rafId = requestAnimationFrame(tick);
    }
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    setProgress(0);
    sync();
    setTimeout(sync, 800);
    window.addEventListener("load", sync);

    var ctaPanel = null;
    Array.prototype.forEach.call(section.querySelectorAll("div"), function (el) {
      if (!ctaPanel && /^#14053333$/i.test(((el.getAttribute("style") || "").match(/background-color:\s*(#[0-9a-f]{8})/i) || [])[1] || "")) ctaPanel = el;
    });
    if (ctaPanel) { ctaPanel.classList.add("km-proc-cta"); ctaPanel.classList.add("km-metal-fx"); }
  })();

  /* --- 4f. Opinie: pozioma taśma (prawo→lewo, hover pauza) --- */
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
    var cards = Array.prototype.slice.call(f663.children);
    if (!cards.length) return;
    var W = f663.offsetWidth;
    var vp = document.createElement("div");
    vp.style.cssText = "overflow:hidden;width:" + W + "px;position:relative;";
    f663.parentNode.insertBefore(vp, f663);
    var track = document.createElement("div");
    track.style.cssText = "display:flex;gap:48px;align-items:stretch;width:max-content;will-change:transform;";
    vp.appendChild(track);
    var CW = isMob ? 320 : 430;
    function prepCard(c) {
      c.style.width = CW + "px";
      c.style.flexShrink = "0";
      c.style.height = "auto";
      var col = c.firstElementChild;
      if (col) { col.style.height = "100%"; }
      var author = c.querySelector('[data-pencil-name="Frame 722"]');
      if (author) author.style.marginTop = "auto";
      c.querySelectorAll("div").forEach(function (d) {
        var m = (d.getAttribute("style") || "").match(/width:\s*([\d.]+)px/);
        if (m && parseFloat(m[1]) > CW - 50) { d.style.width = "auto"; d.style.maxWidth = "100%"; }
        if (getComputedStyle(d).whiteSpace === "nowrap" && d.scrollWidth > CW - 50) d.style.whiteSpace = "normal";
      });
    }
    cards.forEach(function (c) { track.appendChild(c); prepCard(c); });
    cards.forEach(function (c) {
      var k = c.cloneNode(true);
      k.style.flexShrink = "0";
      track.appendChild(k);
    });
    f663.remove();
    var pos = 0, hovered = false, last = performance.now(), SPEED = 26;
    function frame(now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!hovered) {
        pos -= SPEED * dt;
        var half = track.scrollWidth / 2 + 24;
        if (-pos >= half) pos += half;
        track.style.transform = "translateX(" + pos + "px)";
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    vp.addEventListener("mouseenter", function () { hovered = true; });
    vp.addEventListener("mouseleave", function () { hovered = false; });
  })();

  /* --- 4g. Tooltip przy kursorze na „Pobierz Demo Raportu" --- */
  (function () {
    if (isMob) return;
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
      if (!tag && el.children.length === 0 && (t.indexOf("CASE /") === 0 || /\/ CASE STUDY$/.test(t))) tag = el;
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


    var state = { hover: false };
    var fill = null;
    var f701 = sec.querySelector('[data-pencil-name="Frame 701"]');
    var slots = [], arrows = [];
    if (f701) {
      slots = Array.prototype.slice.call(f701.querySelectorAll('[data-pencil-name^="Case bar"]'));
      slots.forEach(function (slot) {
        slot.classList.add("km-case-slot");
        slot.style.backgroundColor = "#E9E9F7";
        slot.style.overflow = "hidden";
        slot.style.position = "relative";
      });
      if (slots.length) {
        fill = document.createElement("div");
        fill.className = "km-slot-fill";
        slots[0].appendChild(fill);
      }
      arrows = Array.prototype.filter.call(f701.children, function (el) {
        return (el.tagName || "").toLowerCase() === "svg" || (el.querySelector && el.querySelector("svg") && !el.querySelector('[data-pencil-name^="Case bar"]'));
      });
    }
    if (rightPanel) {
      rightPanel.classList.add("km-metal-fx");
      rightPanel.classList.add("km-metal-violet");
      rightPanel.style.cursor = "pointer";
      rightPanel.addEventListener("click", function () {
        var c = CASES[idx];
        if (c && c.slug) window.location.href = "case-study.html?slug=" + encodeURIComponent(c.slug);
      });
    }
    cardRow.addEventListener("mouseenter", function () {
      state.hover = true;
      if (fill) fill.style.animationPlayState = "paused";
    });
    cardRow.addEventListener("mouseleave", function () {
      state.hover = false;
      if (fill) fill.style.animationPlayState = "";
    });

    var CASES = [
      { title: "7 KONCEPCJI\n14 DNI.", desc: "Badania RITE: szybka walidacja siedmiu koncepcji procesu. Efekty nie wymagają zmian od kilku lat.", tag: "APTEKA GEMINI / CASE STUDY", slug: "gemini-badania-rite", right: "Dlatego nie dostarczam raportów do szuflady: pokazuję, gdzie tracisz pieniądze w doświadczeniu klienta i co zrobić, żeby je odzyskać." },
      { title: "MILISEKUNDY\n= PIENIĄDZE.", desc: "Optymalizacja krytycznych ścieżek na podstawie badań i twardych danych analitycznych.", tag: "XTB / CASE STUDY", slug: "xtb-optymalizacja-sciezek", right: "Szybkość interfejsu przełożona wprost na wynik finansowy — badania wskazały, które ścieżki naprawdę bolą użytkowników." },
      { title: "SEGMENTACJA\nBEHAWIORALNA.", desc: "Połączenie danych behawioralnych z wywiadami pogłębionymi w jedną mapę segmentów.", tag: "OLX / CASE STUDY", slug: "olx-segmentacja-klientow", right: "Segmentacja, która uporządkowała roadmapę: zespół skupił się na segmentach o największym potencjale wzrostu." }
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
    var timer = null;
    function advance(dir) {
      if (document.hidden || state.hover) { timer = setTimeout(function () { advance(dir); }, 400); return; }
      dir = dir || 1;
      idx = (idx + dir + CASES.length) % CASES.length;
      var parent = cardRow.parentElement;
      if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
      if (getComputedStyle(parent).overflow !== "hidden") parent.style.overflow = "hidden";
      var W = cardRow.offsetWidth;
      var clone = cardRow.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = cardRow.offsetLeft + "px";
      clone.style.top = cardRow.offsetTop + "px";
      clone.style.width = W + "px";
      clone.style.zIndex = "2";
      parent.appendChild(clone);
      setCase(CASES[idx]);
      var blurKf = { filter: ["blur(0px)", "blur(7px)", "blur(0px)"], offset: [0, 0.5, 1] };
      var opts = { duration: SLIDE, easing: EASECR, fill: "forwards" };
      clone.animate({ transform: ["translateX(0px)", "translateX(" + (-dir * W) + "px)"] }, opts);
      clone.animate(blurKf, opts);
      cardRow.animate({ transform: ["translateX(" + (dir * W) + "px)", "translateX(0px)"] }, opts);
      cardRow.animate(blurKf, opts);
      setTimeout(function () { clone.remove(); cycle(); }, SLIDE + 40);
    }
    function cycle() {
      if (fill && slots.length) {
        slots[idx % slots.length].appendChild(fill);
        fill.style.animationPlayState = "";
        fill.classList.remove("is-run");
        void fill.offsetWidth;
        fill.classList.add("is-run");
      }
      clearTimeout(timer);
      timer = setTimeout(advance, 3500);
    }
    function goTo(target) {
      if (target === idx) return;
      clearTimeout(timer);
      var n = CASES.length;
      var dir = target === (idx + 1) % n ? 1 : target === (idx - 1 + n) % n ? -1 : (target > idx ? 1 : -1);
      idx = (target - dir + n) % n;
      advance(dir);
    }
    slots.forEach(function (slot, i) {
      slot.addEventListener("click", function () { goTo(i % CASES.length); });
    });
    if (arrows.length >= 2) {
      arrows.forEach(function (a) { a.classList.add("km-case-arrow"); });
      arrows[0].style.cursor = "pointer";
      arrows[arrows.length - 1].style.cursor = "pointer";
      arrows[0].addEventListener("click", function () { goTo((idx - 1 + CASES.length) % CASES.length); });
      arrows[arrows.length - 1].addEventListener("click", function () { goTo((idx + 1) % CASES.length); });
    }
    cycle();
  })();

  /* --- 4j. „Poznaj mnie od innej strony": logo UX w Lesie + widget Spotify --- */
  (function () {
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length) return;
      var t = (el.textContent || "").replace(/\u00A0/g, " ").trim();
      if (t === "UX w Lesie") {
        el.style.whiteSpace = "normal";
        el.innerHTML = '<a href="https://www.uxwlesie.pl" target="_blank" rel="noopener" style="display:inline-block"><img src="assets/uxwlesie.png" alt="UX w Lesie" style="height:56px;display:block"/></a>';
        var row = el.closest('[data-pencil-name="Frame 732"]');
        if (row) { row.style.alignItems = "center"; row.style.justifyContent = "center"; }
      } else if (t === "Spotify pasek widget") {
        var p = el.parentElement;
        var w = p ? Math.min(p.clientWidth || 600, 640) : 600;
        el.style.whiteSpace = "normal";
        el.style.width = w + "px";
        el.innerHTML = '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/show/1SOUA8UPfusGYKE1oj2YTC?utm_source=generator&theme=0&si=74e6eb26634e4618" width="100%" height="152" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Podcast UX w Lesie na Spotify"></iframe>';
      }
    });
  })();

  /* --- 4k. Karty „O czym ostatnio pisałem?" — równa wysokość, button zawsze w tym samym miejscu --- */
  (function () {
    var cols = document.querySelectorAll('[data-pencil-name="Article Col"]');
    cols.forEach(function (c) {
      c.style.height = "auto";
      c.style.justifyContent = "space-between";
      Array.prototype.forEach.call(c.children, function (k) {
        if (k.children.length === 0 && /font-size:\s*18px/.test(k.getAttribute("style") || "")) k.style.flex = "1 1 0";
      });
      var row = c.parentElement;
      if (row && /Articles Row/.test(row.getAttribute("data-pencil-name") || "")) row.style.alignItems = "stretch";
      /* button karty: zawsze tekst + ikona, bez tła, hover = sam metaliczny border */
      var btn = Array.prototype.find.call(c.children, function (k) { return k.querySelector && k.querySelector("svg"); });
      if (btn) {
        btn.classList.remove("km-grad-btn", "km-grad-primary");
        btn.classList.add("km-metal-fx", "km-metal-violet", "km-flat-metal");
        var hasText = Array.prototype.some.call(btn.children, function (k) { return k.tagName === "DIV" && (k.textContent || "").trim(); });
        if (!hasText) {
          var lbl = document.createElement("div");
          lbl.setAttribute("style", "box-sizing: border-box; color: #1D0055; font-family: Inter, system-ui, sans-serif; font-size: 18px; font-style: normal; font-weight: 400; letter-spacing: 0px; line-height: normal; text-align: left; white-space: nowrap");
          lbl.textContent = "Przeczytaj artykuł";
          btn.insertBefore(lbl, btn.firstChild);
        }
      }
    });
    /* Karty usług — hover podkreśla tytuł, cała karta klika do podstrony */
    var SVC_LINKS = {
      "Badania UX": "badania-ux.html",
      "Strategia w biznesie": "uslugi.html",
      "Dyrektor UX": "dyrektor-ux.html",
      "Segmentacja klientów": "segmentacja-klientow.html",
      "Audyt UX": "audyt-ux.html",
      "Wystąpienia i szkolenia": "wystapienia-i-szkolenia.html",
      "Konsultacje i Mentoring": "konsultacje-i-mentoring.html",
      "Konsultacje i mentoring": "konsultacje-i-mentoring.html"
    };
    document.querySelectorAll(".km-metal-fx").forEach(function (card) {
      var cst = card.getAttribute("style") || "";
      if (!/backdrop-filter/.test(cst) || !(/#1c00544d/i.test(cst) || /rgba\(28,\s*0,\s*84/.test(cst))) return;
      var title = null;
      card.querySelectorAll("div").forEach(function (d) {
        if (title || d.children.length) return;
        var st = d.getAttribute("style") || "";
        if (/Nexa/.test(st) && /font-size:\s*(2[4-9]|[34][0-9])px/.test(st)) title = d;
      });
      if (!title) return;
      title.classList.add("km-svc-title");
      var href = SVC_LINKS[(title.textContent || "").replace(/ /g, " ").trim()];
      if (href && !card._kmNav) {
        card._kmNav = 1;
        card.style.cursor = "pointer";
        card.addEventListener("click", function () { window.location.href = href; });
      }
    });
    /* Buttony „Przeczytaj artykuł" — link do artykułu przypisanego do karty (z arkusza CMS) */
    if (cols.length) {
      fetch("https://docs.google.com/spreadsheets/d/1sxqitjESZckLXDduOcaM3FIkbyvKlIe5VNhwG-dSYdw/export?format=csv&gid=0")
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (text) {
          var rows = [], row = [], cell = "", q = false;
          for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
            else if (ch === '"') q = true;
            else if (ch === ",") { row.push(cell); cell = ""; }
            else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
            else cell += ch;
          }
          if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
          var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
          var arts = rows.slice(1).map(function (r2) {
            var o = {}; head.forEach(function (h, j) { o[h] = (r2[j] || "").trim(); }); return o;
          }).filter(function (a) { return a.tytul; });
          function norm(s) { return (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim().toLowerCase(); }
          cols.forEach(function (c) {
            var title = null;
            Array.prototype.forEach.call(c.children, function (k) {
              if (!title && k.children.length === 0 && /font-size:\s*18px/.test(k.getAttribute("style") || "")) title = k;
            });
            if (!title) return;
            var tt = norm(title.textContent);
            var art = arts.filter(function (a) {
              var at = norm(a.tytul);
              return at === tt || at.indexOf(tt.slice(0, 30)) === 0 || tt.indexOf(at.slice(0, 30)) === 0;
            })[0];
            if (!art) return;
            var full = /^https:\/\/docs\.google\.com\/document\//.test(art.tresc || "") ? (art.tresc_md || "") : (art.tresc || "");
            var href = full && art.slug ? "artykul.html?slug=" + encodeURIComponent(art.slug) : (art.url || "");
            if (!href) return;
            var cardBtn = Array.prototype.find.call(c.children, function (k) { return k.querySelector && k.querySelector("svg"); });
            if (cardBtn && !cardBtn._kmArt) {
              cardBtn._kmArt = 1;
              cardBtn.style.cursor = "pointer";
              cardBtn.addEventListener("click", function () { window.location.href = href; });
            }
          });
        })
        .catch(function (e) { console.warn("Karty artykułów: brak linków —", e.message || e); });
    }
    /* „Zobacz wszystkie artykuły" — szerokość hug, do lewej */
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length) return;
      if (!/^Zobacz wszystkie artyku/i.test((el.textContent || "").trim())) return;
      var btn = el.parentElement;
      if (!btn || !/background-color/.test(btn.getAttribute("style") || "")) return;
      btn.style.width = "fit-content";
      btn.style.alignSelf = "flex-start";
      btn.style.justifyContent = "flex-start";
    });
  })();

  /* --- 4l. Calendly: kalendarz inline w sekcji terminów + popup z pływającego widżetu --- */
  (function () {
    var CAL_URL = "https://calendly.com/krzysiek-quale/30min";
    var targets = [];
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length) return;
      if (/Tu pojawi się widżet rezerwacji/.test(el.textContent || "")) targets.push(el);
    });
    if (!targets.length) return;
    var needScript = false;
    targets.forEach(function (el) {
      var float = el.closest('[data-pencil-name="div - float"]');
      el.style.display = "none";
      if (float) {
        if (float._kmCal) return;
        float._kmCal = 1;
        float.style.cursor = "pointer";
        float.addEventListener("click", function () {
          if (window.Calendly) window.Calendly.initPopupWidget({ url: CAL_URL });
          else window.open(CAL_URL, "_blank");
        });
        needScript = true;
      } else {
        var box = el.parentElement || el;
        box.style.padding = "0 0 24px 40px";
        var w = document.createElement("div");
        w.className = "calendly-inline-widget";
        w.setAttribute("data-url", CAL_URL);
        w.setAttribute("data-resize", "true");
        var h0 = Math.max((box.clientHeight || 0) - 24, 480);
        w.style.cssText = "min-width:320px;height:700px;width:100%;";
        box.appendChild(w);
        /* panel z blur + Frame 676 rosną razem z widgetem, żeby Calendly mieścił się bez scrolla */
        var panel = box.parentElement;
        var frame = panel && panel.closest('[data-pencil-name="Frame 676"]');
        if (panel && frame && getComputedStyle(panel).position === "absolute") {
          var baseP = panel.offsetHeight;
          var baseT = parseFloat(getComputedStyle(panel).top) || 0;
          var baseF = frame.offsetHeight;
          var sync = function () {
            var extra = Math.max(0, w.offsetHeight - h0);
            panel.style.height = (baseP + extra) + "px";
            panel.style.top = (baseT - extra) + "px";
            frame.style.height = (baseF + extra) + "px";
          };
          sync();
          if (window.ResizeObserver) new ResizeObserver(sync).observe(w);
        } else {
          box.style.height = "auto";
        }
        needScript = true;
      }
    });
    if (needScript && !document.querySelector('script[src*="assets.calendly.com"]')) {
      var sc = document.createElement("script");
      sc.src = "https://assets.calendly.com/assets/external/widget.js";
      sc.async = true;
      document.head.appendChild(sc);
      var lk = document.createElement("link");
      lk.rel = "stylesheet";
      lk.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(lk);
    }
  })();

  /* --- 4l2. „Umów videorozmowę" — tekst/button otwiera Calendly --- */
  (function () {
    var CAL_URL = "https://calendly.com/krzysiek-quale/30min";
    function openCal() {
      if (window.Calendly) window.Calendly.initPopupWidget({ url: CAL_URL });
      else window.open(CAL_URL, "_blank");
    }
    document.querySelectorAll("div").forEach(function (el) {
      if (el.children.length) return;
      var t = (el.textContent || "").replace(/ /g, " ").trim();
      if (t !== "Umów videorozmowę") return;
      var btn = el.parentElement && el.parentElement.classList.contains("km-roll-btn") ? el.parentElement : el;
      if (btn._kmCal) return;
      btn._kmCal = 1;
      btn.style.cursor = "pointer";
      if (btn === el) el.classList.add("km-link-fx");
      btn.addEventListener("click", openCal);
    });
  })();

  /* --- 4m0. Formularze na stronie Kontakt (atrapy z Pen → prawdziwe pola + walidacja + mailto) --- */
  (function () {
    var MAIL = "krzysiek@quale.agency";
    var USLUGI_OPT = ["Badania UX", "Strategia w biznesie", "Zewnętrzny Dyrektor UX", "Segmentacja klientów", "Audyt UX", "Konsultacje i mentoring", "Wystąpienia i szkolenia", "Jeszcze nie wiem"];
    document.querySelectorAll('[data-pencil-name="form"]').forEach(function (form) {
      if (form._km) return;
      form._km = 1;
      var fields = [];
      form.querySelectorAll("div").forEach(function (box) {
        var st = box.getAttribute("style") || "";
        if (!/border: 1px solid (#d0d0d9|rgb\(208,\s*208,\s*217\))/i.test(st)) return;
        var group = box.parentElement;
        var label = null;
        Array.prototype.forEach.call(group.children, function (d) {
          if (!label && d !== box && d.children.length === 0 && /Nexa/.test(d.getAttribute("style") || "")) label = d;
        });
        var lt = label ? (label.textContent || "").replace(/ /g, " ").trim() : "";
        var required = /\*\s*$/.test(lt);
        var name = (box.getAttribute("data-pencil-name") || "").toLowerCase();
        var phLeaf = box.querySelector("div");
        var ph = phLeaf ? (phLeaf.textContent || "").replace(/ /g, " ").trim() : "";
        var isMail = /e-mail/i.test(lt);
        var kind = name === "select" ? "select" : (name === "textarea" || box.offsetHeight >= 100 ? "textarea" : "input");
        box.innerHTML = "";
        var ctl;
        if (kind === "select") {
          ctl = document.createElement("select");
          var o0 = document.createElement("option");
          o0.value = ""; o0.textContent = "Wybierz usługę…";
          ctl.appendChild(o0);
          USLUGI_OPT.forEach(function (u) {
            var o = document.createElement("option");
            o.value = u; o.textContent = u;
            ctl.appendChild(o);
          });
        } else {
          ctl = document.createElement(kind === "textarea" ? "textarea" : "input");
          if (kind === "input") ctl.type = isMail ? "email" : "text";
          ctl.placeholder = ph;
        }
        ctl.className = "km-field";
        if (kind === "textarea") ctl.style.height = "100%";
        if (kind === "select") ctl.style.cssText = "width:100%;height:100%;border:0;outline:0;background:transparent;font-family:Inter,system-ui,sans-serif;font-size:16px;color:#15172C;padding:0 12px;";
        ctl.setAttribute("aria-label", lt.replace(/\s*\*\s*$/, "") || ph);
        if (required) ctl.setAttribute("aria-required", "true");
        if (!/padding/.test(st) && kind !== "select") box.style.padding = "12px 16px";
        box.classList.add("km-kbox");
        box.style.overflow = "visible";
        box.appendChild(ctl);
        box.addEventListener("click", function () { ctl.focus(); });
        ctl.addEventListener("input", function () {
          box.classList.remove("km-invalid");
          var e2 = group.querySelector(".km-form-err");
          if (e2) e2.remove();
        });
        fields.push({ box: box, group: group, ctl: ctl, required: required, isMail: isMail, label: lt.replace(/\s*\*\s*$/, "").trim() || ph });
      });
      if (!fields.length) return;
      var btn = form.querySelector('[data-pencil-name="button"]');
      var subject = btn ? (btn.textContent || "").trim() : "Formularz kontaktowy";
      function mark(f, msg) {
        f.box.classList.add("km-invalid");
        if (!f.group.querySelector(".km-form-err")) {
          var d = document.createElement("div");
          d.className = "km-form-err";
          d.setAttribute("role", "alert");
          d.textContent = msg;
          f.group.appendChild(d);
        }
      }
      function submit() {
        form.querySelectorAll(".km-form-err").forEach(function (x) { x.remove(); });
        form.querySelectorAll(".km-invalid").forEach(function (x) { x.classList.remove("km-invalid"); });
        var bad = false;
        fields.forEach(function (f) {
          var v = (f.ctl.value || "").trim();
          if (f.required && !v) { mark(f, "To pole jest wymagane."); bad = true; }
          else if (f.isMail && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { mark(f, "Podaj poprawny adres e-mail."); bad = true; }
        });
        if (bad) {
          var fb = form.querySelector(".km-invalid");
          if (fb) { fb.scrollIntoView({ block: "center", behavior: "smooth" }); var ff = fb.querySelector(".km-field"); if (ff) ff.focus(); }
          return;
        }
        var body = fields.map(function (f) { return f.label + ": " + (f.ctl.value || "").trim(); }).join("\n");
        window.location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Strona — " + subject) + "&body=" + encodeURIComponent(body);
        var ok = form.querySelector(".km-form-ok");
        if (!ok) {
          ok = document.createElement("div");
          ok.className = "km-form-ok";
          ok.setAttribute("role", "status");
          form.appendChild(ok);
        }
        ok.textContent = "Otwieram Twój program pocztowy — jeśli nic się nie wydarzyło, napisz na " + MAIL + ".";
      }
      if (btn) {
        btn.style.cursor = "pointer";
        btn.classList.add("km-metal-fx");
        btn.classList.add("km-rock-icon");
        btn.classList.add("km-ghost-hover");
        btn.addEventListener("click", submit);
      }
      fields.forEach(function (f) {
        f.ctl.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && f.ctl.tagName === "INPUT") { e.preventDefault(); submit(); }
        });
      });
    });
  })();

  /* --- 4m. Formularz pytań: prawdziwe pola + walidacja + wysyłka mailem --- */
  (function () {
    var MAILTO = "krzysiek@quale.agency";
    var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-pencil-name="Input"]'));
    if (!boxes.length) return;
    function labelFor(box) {
      var p = box.parentElement, prev = box.previousElementSibling;
      while (!prev && p && p !== document.body) { prev = p.previousElementSibling; p = p.parentElement; }
      return prev ? (prev.textContent || "").replace(/\u00A0/g, " ").trim() : "";
    }
    var panels = [];
    boxes.forEach(function (box) {
      var label = labelFor(box);
      var isEmail = /mail/i.test(label);
      var content = box.querySelector('[data-pencil-name="Content"]') || box;
      var field = document.createElement(isEmail ? "input" : "textarea");
      field.className = "km-field";
      field.setAttribute("aria-label", label || (isEmail ? "Adres e-mail" : "Treść wiadomości"));
      if (isEmail) {
        field.type = "email";
        field.name = "email";
        field.autocomplete = "email";
        field.inputMode = "email";
        field.placeholder = "jan@firma.pl";
      } else {
        field.name = "message";
        field.rows = 1;
        field.placeholder = "Napisz, w czym mogę pomóc…";
        field.addEventListener("input", function () {
          field.style.height = "auto";
          field.style.height = Math.min(220, Math.max(24, field.scrollHeight)) + "px";
        });
      }
      field.required = true;
      content.style.height = "auto";
      content.style.minHeight = "24px";
      content.appendChild(field);
      box.style.cursor = "text";
      box.addEventListener("click", function () { field.focus(); });
      box._kmField = field;
      var panel = box;
      for (var i = 0; i < 5 && panel && panel !== document.body; i++) {
        panel = panel.parentElement;
        if (panel && panel.querySelectorAll('[data-pencil-name="Input"]').length >= 1 && /Zadaj mi pytanie|Wyślij/i.test(panel.textContent || "")) break;
      }
      if (panel && panels.indexOf(panel) === -1) panels.push(panel);
    });
    function errFor(box) {
      var e = box._kmErr;
      if (!e) {
        e = document.createElement("div");
        e.className = "km-form-err";
        e.setAttribute("role", "alert");
        box.parentNode.insertBefore(e, box.nextSibling);
        box._kmErr = e;
      }
      return e;
    }
    function clearErr(box) {
      box.classList.remove("km-invalid");
      box._kmField.removeAttribute("aria-invalid");
      if (box._kmErr) box._kmErr.textContent = "";
    }
    function setErr(box, msg) {
      box.classList.add("km-invalid");
      box._kmField.setAttribute("aria-invalid", "true");
      errFor(box).textContent = msg;
    }
    panels.forEach(function (panel) {
      var pBoxes = Array.prototype.slice.call(panel.querySelectorAll('[data-pencil-name="Input"]'));
      var btnLeaf = null;
      Array.prototype.forEach.call(panel.querySelectorAll("div"), function (el) {
        if (!btnLeaf && el.children.length === 0 && /^(Zadaj mi pytanie|Wyślij wiadomość|Wyślij)$/i.test((el.textContent || "").replace(/\u00A0/g, " ").trim())) btnLeaf = el;
      });
      var clickable = btnLeaf ? btnLeaf.parentElement : null;
      function submit() {
        var ok = true, email = "", msg = "";
        pBoxes.forEach(function (box) {
          clearErr(box);
          var f = box._kmField;
          var v = (f.value || "").trim();
          if (f.type === "email") {
            email = v;
            if (!v) { setErr(box, "Podaj adres e-mail — na niego odpowiem."); ok = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setErr(box, "Ten adres wygląda na niepełny — sprawdź literówkę."); ok = false; }
          } else {
            msg = v;
            if (!v) { setErr(box, "Napisz chociaż zdanie — o co chcesz zapytać?"); ok = false; }
          }
        });
        if (!ok) {
          var firstBad = pBoxes.filter(function (b) { return b.classList.contains("km-invalid"); })[0];
          if (firstBad) firstBad._kmField.focus();
          return;
        }
        var subject = encodeURIComponent("Pytanie ze strony krzysztof-miotk");
        var body = encodeURIComponent(msg + "\n\n—\nOdpowiedz na: " + email);
        window.location.href = "mailto:" + MAILTO + "?subject=" + subject + "&body=" + body;
        var okMsg = panel.querySelector(".km-form-ok");
        if (!okMsg) {
          okMsg = document.createElement("div");
          okMsg.className = "km-form-ok";
          okMsg.setAttribute("role", "status");
          var last = pBoxes[pBoxes.length - 1];
          (last._kmErr || last).parentNode.appendChild(okMsg);
        }
        okMsg.textContent = "Otwieram Twój program pocztowy z gotową wiadomością — wystarczy kliknąć „Wyślij”.";
      }
      pBoxes.forEach(function (box) {
        box._kmField.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && box._kmField.tagName === "INPUT") { e.preventDefault(); submit(); }
        });
        box._kmField.addEventListener("input", function () { clearErr(box); });
      });
      if (clickable) {
        clickable.style.cursor = "pointer";
        clickable.classList.add("km-metal-fx");
        clickable.classList.add("km-rock-icon");
        clickable.classList.add("km-ghost-hover");
        clickable.addEventListener("click", submit);
      }
    });
  })();

  /* --- 4c. Pływający widżet kalendarza — stały do sekcji „Co mówią klienci" --- */
  (function () {
    var OFFER_PAGE = /(badania-ux|segmentacja-klientow|audyt-ux|konsultacje-i-mentoring|dyrektor-ux|wystapienia-i-szkolenia)\.html$/;
    var existing = document.querySelector('[data-pencil-name="div - float"]');
    if (isMob) { if (existing) existing.style.display = "none"; return; }
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
    var st = el.getAttribute("style") || "";
    if (!/background[^;]*(#A399FD|163,\s*153,\s*253)/i.test(st)) return;
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
