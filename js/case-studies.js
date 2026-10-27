/* Case studies — dane z arkusza Google (ten sam plik co artykuły, karty „Case_study" i „Case_study_tresci").
   Kolumny karty Case_study: tytul | slug | klient | branza | data (RRRR-MM-DD) | czas_czytania | zajawka | url | wyrozniony (TAK/NIE) */
(function () {
  "use strict";
  var CONFIG = {
    SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/1sxqitjESZckLXDduOcaM3FIkbyvKlIe5VNhwG-dSYdw/export?format=csv",
    GID_META: "770001"
  };

  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
    return rows;
  }

  function toObjects(rows) {
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1).filter(function (r) { return r.join("").trim(); }).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
      return o;
    });
  }

  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    return m ? m[3] + "." + m[2] + "." + m[1] : d;
  }

  function leaf(scope, test) {
    var out = null;
    scope.querySelectorAll("div").forEach(function (el) {
      if (!out && el.children.length === 0 && test((el.textContent || "").replace(/ /g, " ").trim())) out = el;
    });
    return out;
  }

  function init(cases) {
    var grid = [];
    document.querySelectorAll("div").forEach(function (el) {
      var kids = el.children;
      if (kids.length < 4 || kids.length > 7) return;
      for (var i = 0; i < kids.length; i++) if (kids[i].children.length > 0) return;
      if (!/Zobacz case study/.test(el.textContent || "")) return;
      grid.push(el);
    });
    if (!grid.length) return;
    cases.sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); });
    var featured = cases.filter(function (a) { return /^tak$/i.test(a.wyrozniony || ""); })[0] || cases[0];
    var rest = cases.filter(function (a) { return a !== featured; });

    var fTitle = leaf(document.body, function (t) { return /^7 koncepcji w 14 dni/.test(t); });
    if (fTitle && featured) {
      var fScope = fTitle.parentElement;
      fTitle.innerText = featured.tytul;
      var fZaj = leaf(fScope, function (t) { return /Szybka walidacja siedmiu koncepcji/.test(t); });
      if (fZaj) fZaj.innerText = featured.zajawka || "";
      var fKat = leaf(fScope.parentElement || fScope, function (t) { return t === "E-COMMERCE"; });
      if (fKat) fKat.innerText = (featured.branza || "").toUpperCase();
      var fMeta = leaf(fScope, function (t) { return /MIN CZYTANIA/.test(t); });
      if (fMeta) fMeta.innerText = fmtDate(featured.data) + "  ·  " + (featured.czas_czytania || "") + " MIN CZYTANIA";
      if (featured._href) {
        fScope.style.cursor = "pointer";
        fScope.addEventListener("click", function () { window.open(featured._href, "_self"); });
      }
    }

    /* lista jak w projekcie mobile: karty w kolumnie, 4 na stronę, paginacja bez strzałek */
    var PAGE = 4;
    var state = { filter: "Wszystkie", page: 0 };
    var rowSet = [];
    grid.forEach(function (card) {
      var r = card.parentElement;
      if (rowSet.indexOf(r) === -1) rowSet.push(r);
      card.style.flex = "none";
      card.style.width = "100%";
    });
    rowSet.forEach(function (r) {
      r.style.flexDirection = "column";
      r.style.gap = "24px";
      r.style.height = "auto";
    });
    var lastRow = rowSet[rowSet.length - 1];
    while (grid.length < PAGE) {
      var cl = grid[grid.length - 1].cloneNode(true);
      lastRow.appendChild(cl);
      grid.push(cl);
    }
    grid.forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () { if (card._href) window.open(card._href, "_self"); });
    });
    var pagRow = document.createElement("div");
    pagRow.style.cssText = "display:flex;flex-direction:row;gap:12px;justify-content:center;align-items:center;width:100%;padding:28px 0 0;";
    lastRow.parentNode.insertBefore(pagRow, lastRow.nextSibling);
    function filtered() {
      if (state.filter === "Wszystkie") return rest;
      var want = state.filter.toLowerCase();
      return rest.filter(function (a) { return (a.branza || "").toLowerCase() === want; });
    }
    function render() {
      var list = filtered();
      var pages = Math.max(1, Math.ceil(list.length / PAGE));
      if (state.page >= pages) state.page = 0;
      grid.forEach(function (card, i) {
        var a = i < PAGE ? list[state.page * PAGE + i] : null;
        if (!a) { card.style.display = "none"; card._href = ""; return; }
        card.style.display = "";
        var meta = leaf(card, function (t) { return /·/.test(t); });
        var kids = Array.prototype.filter.call(card.children, function (c) { return (c.textContent || "").trim(); });
        if (meta) meta.innerText = (a.branza || "").toUpperCase() + "  ·  " + fmtDate(a.data) + "  ·  " + (a.czas_czytania || "") + " MIN";
        if (kids[1]) kids[1].innerText = a.tytul || "";
        if (kids[2]) kids[2].innerText = a.zajawka || "";
        card._href = a._href || "";
      });
      pagRow.innerHTML = "";
      for (var p = 0; p < pages; p++) (function (p) {
        var b = document.createElement("div");
        b.textContent = String(p + 1);
        var active = p === state.page;
        b.style.cssText = "width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:Inter,system-ui,sans-serif;font-size:17px;font-weight:500;" + (active ? "background:#5205E7;color:#FFFFFF;" : "background:#FFFFFF;color:#15172C;border:1px solid #D4D0F8;");
        b.addEventListener("click", function () { state.page = p; render(); });
        pagRow.appendChild(b);
      })(p);
    }
    /* chipy tagów: stan aktywny, ukrywanie pustych, filtr z ?tag= */
    var chipEls = {};
    var chipStyles = { active: null, idle: null, activeLeaf: null, idleLeaf: null };
    document.querySelectorAll("div").forEach(function (chip) {
      var t = (chip.textContent || "").trim();
      if (chip.children.length !== 1 || chip.offsetHeight > 60 || chip.offsetHeight < 30) return;
      if (!/^(Wszystkie|E-commerce|Fintech|Marketplace)$/.test(t)) return;
      chipEls[t] = chip;
      var st = chip.getAttribute("style") || "";
      var lf = chip.firstElementChild ? (chip.firstElementChild.getAttribute("style") || "") : "";
      if (t === "Wszystkie") { chipStyles.active = st; chipStyles.activeLeaf = lf; }
      else if (!chipStyles.idle) { chipStyles.idle = st; chipStyles.idleLeaf = lf; }
      chip.style.cursor = "pointer";
      chip.addEventListener("click", function () {
        state.filter = t;
        state.page = 0;
        render();
      });
    });
    var allItems = [featured].concat(rest);
    function paintChips() {
      Object.keys(chipEls).forEach(function (name) {
        var chip = chipEls[name];
        if (name !== "Wszystkie") {
          var cnt = allItems.filter(function (a) {
            var k = (a.branza || "").toLowerCase();
            var w = name.toLowerCase();
            return k === w || k.indexOf(w) !== -1 || (k && w.indexOf(k) !== -1);
          }).length;
          if (!cnt) { chip.style.display = "none"; return; }
        }
        var active = name === state.filter;
        if (chipStyles.active && chipStyles.idle) chip.setAttribute("style", active ? chipStyles.active : chipStyles.idle);
        if (chip.firstElementChild && chipStyles.activeLeaf && chipStyles.idleLeaf) chip.firstElementChild.setAttribute("style", active ? chipStyles.activeLeaf : chipStyles.idleLeaf);
        chip.style.cursor = "pointer";
        chip.style.display = "";
      });
    }
    var tagQ = new URLSearchParams(location.search).get("tag") || "";
    if (tagQ) {
      Object.keys(chipEls).forEach(function (n) {
        var a = n.toLowerCase(), b = tagQ.toLowerCase();
        if (a === b || a.indexOf(b) !== -1 || b.indexOf(a) !== -1) state.filter = n;
      });
    }
    var renderBase = render;
    render = function () { renderBase(); paintChips(); };
    render();
  }

  if (!/case-studies\.html/.test(location.pathname)) return;
  if (!CONFIG.SHEET_CSV_URL) return;
  fetch(CONFIG.SHEET_CSV_URL + "&gid=" + CONFIG.GID_META)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " — arkusz nie jest publiczny?");
      return r.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);
      if (!rows.length || rows[0].join(",").toLowerCase().indexOf("tytul") === -1) {
        throw new Error("odpowiedź nie wygląda na CSV z kolumną 'tytul' (sprawdź udostępnianie arkusza)");
      }
      var cases = toObjects(rows).filter(function (a) { return a.tytul; });
      cases.forEach(function (a) {
        var full = /^https:\/\/docs\.google\.com\/document\//.test((a.tresc || "").trim()) ? (a.tresc_md || "").trim() : (a.tresc || "").trim();
        a._href = full ? "case-study.html?slug=" + encodeURIComponent(a.slug) : (a.url || "");
      });
      if (cases.length) init(cases);
    })
    .catch(function (e) { console.warn("Case studies: zostają karty statyczne —", e.message || e); });
})();
