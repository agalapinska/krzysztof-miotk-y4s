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

  /* --- 4d. Hero: rotacja zdjęć wg klatek „Animacja 1" (pasek 3.5s, spód → góra) --- */
  (function () {
    var f662 = document.querySelector('[data-pencil-name="Frame 662"]');
    if (!f662 || reduced) return;
    var photo = f662.firstElementChild;
    if (!photo || !/url\(/.test(photo.style.backgroundImage || "")) return;
    var container = f662.parentElement;
    var absLayers = Array.prototype.filter.call(container.children, function (el) {
      return el !== f662 && /url\(/.test(el.style.backgroundImage || "");
    });
    if (absLayers.length < 2) return;
    var backEl = absLayers[0], midEl = absLayers[1];
    if (backEl.offsetLeft < midEl.offsetLeft) { var tmp = backEl; backEl = midEl; midEl = tmp; }

    var track = null, fill = null;
    Array.prototype.forEach.call(f662.children, function (el) {
      var cs = getComputedStyle(el);
      if (cs.backgroundColor === "rgb(233, 233, 247)") track = el;
      if (cs.backgroundColor === "rgb(82, 5, 231)" && cs.position === "absolute") fill = el;
    });
    if (track && fill) {
      track.style.position = "relative";
      track.appendChild(fill);
      fill.style.left = ""; fill.style.top = ""; fill.style.width = ""; fill.style.height = "";
      fill.classList.add("km-hero-fill");
    }

    function getUrl(el) {
      var m = (el.style.backgroundImage || "").match(/url\(['"]?([^'")]+)['"]?\)/);
      return m && m[1];
    }
    function setUrl(el, u) {
      el.style.backgroundImage = el.style.backgroundImage.replace(/url\(['"]?[^'")]+['"]?\)/, "url('" + u + "')");
    }

    var slotB = { l: backEl.offsetLeft, t: backEl.offsetTop, w: backEl.offsetWidth, h: backEl.offsetHeight };
    var slotM = { l: midEl.offsetLeft, t: midEl.offsetTop, w: midEl.offsetWidth, h: midEl.offsetHeight };
    var slotF = { l: f662.offsetLeft + photo.offsetLeft, t: f662.offsetTop + photo.offsetTop, w: photo.offsetWidth, h: photo.offsetHeight };
    var EASE = "cubic-bezier(.45,.05,.18,1)", DUR = 1250;

    function swap(done) {
      var uF = getUrl(photo), uM = getUrl(midEl), uB = getUrl(backEl);
      var trans = "left " + DUR + "ms " + EASE + ",top " + DUR + "ms " + EASE + ",width " + DUR + "ms " + EASE + ",height " + DUR + "ms " + EASE;
      var clone = document.createElement("div");
      clone.style.cssText = "position:absolute;z-index:4;background-image:url('" + uM + "');background-size:cover;background-position:center;" +
        "left:" + slotM.l + "px;top:" + slotM.t + "px;width:" + slotM.w + "px;height:" + slotM.h + "px;transition:" + trans + ";";
      var veil = document.createElement("div");
      veil.style.cssText = "position:absolute;inset:0;background:linear-gradient(#ffffff66,#ffffff66),linear-gradient(#49456e66,#49456e66);opacity:1;transition:opacity " + DUR + "ms " + EASE + ";";
      clone.appendChild(veil);
      container.appendChild(clone);
      midEl.style.visibility = "hidden";
      var backCss = backEl.style.cssText;
      var f662Overflow = f662.style.overflow;
      f662.style.overflow = "visible";
      backEl.style.transition = trans;
      var dx = slotB.l - slotF.l, dy = slotB.t - slotF.t;
      var sx = slotB.w / slotF.w, sy = slotB.h / slotF.h;
      photo.style.transition = "transform " + DUR + "ms " + EASE + ",opacity " + DUR + "ms " + EASE;
      photo.style.transformOrigin = "top left";
      photo.style.zIndex = "0";
      void clone.offsetWidth;
      clone.style.left = slotF.l + "px"; clone.style.top = slotF.t + "px";
      clone.style.width = slotF.w + "px"; clone.style.height = slotF.h + "px";
      veil.style.opacity = "0";
      backEl.style.left = slotM.l + "px"; backEl.style.top = slotM.t + "px";
      backEl.style.width = slotM.w + "px"; backEl.style.height = slotM.h + "px";
      photo.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
      photo.style.opacity = "0.6";
      setTimeout(function () {
        backEl.style.cssText = backCss;
        setUrl(photo, uM); setUrl(midEl, uB); setUrl(backEl, uF);
        photo.style.transition = "none"; photo.style.transform = ""; photo.style.opacity = ""; photo.style.zIndex = "";
        f662.style.overflow = f662Overflow;
        midEl.style.visibility = "";
        clone.remove();
        void photo.offsetWidth;
        done();
      }, DUR + 60);
    }

    function cycle() {
      if (fill) { fill.classList.remove("is-run"); void fill.offsetWidth; fill.classList.add("is-run"); }
      setTimeout(function () {
        if (document.hidden) { cycle(); return; }
        swap(cycle);
      }, 3500);
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
