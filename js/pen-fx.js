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
    [/umów|napisz wiadomość|wyślij|zapisz się|pobierz/i, CONTACT],
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
    var trigger = null;
    nav.querySelectorAll("div").forEach(function (el) {
      if (!trigger && /Usługi\s*:/.test(el.textContent || "") && el.textContent.trim().length < 130) trigger = el;
    });
    trigger = trigger || nav;
    var hideT;
    function open() { clearTimeout(hideT); wrap.classList.add("is-open"); }
    function close() { hideT = setTimeout(function () { wrap.classList.remove("is-open"); }, 160); }
    [trigger, mega].forEach(function (el) {
      el.addEventListener("mouseenter", open);
      el.addEventListener("mouseleave", close);
    });
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
