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

    grid.forEach(function (card, i) {
      var a = rest[i];
      if (!a) { card.style.display = "none"; return; }
      var meta = leaf(card, function (t) { return /·/.test(t); });
      var kids = Array.prototype.filter.call(card.children, function (c) { return (c.textContent || "").trim(); });
      if (meta) meta.innerText = (a.branza || "").toUpperCase() + "  ·  " + fmtDate(a.data) + "  ·  " + (a.czas_czytania || "") + " MIN";
      if (kids[1]) kids[1].innerText = a.tytul || "";
      if (kids[2]) kids[2].innerText = a.zajawka || "";
      card.setAttribute("data-branza", (a.branza || "").toLowerCase());
      var href = a._href;
      if (href) {
        card.style.cursor = "pointer";
        card.addEventListener("click", function () { window.open(href, "_self"); });
      }
    });

    document.querySelectorAll("div").forEach(function (chip) {
      var t = (chip.textContent || "").trim();
      if (chip.children.length !== 1 || chip.offsetHeight > 60 || chip.offsetHeight < 30) return;
      if (!/^(Wszystkie|E-commerce|Fintech|Marketplace)$/.test(t)) return;
      chip.style.cursor = "pointer";
      chip.addEventListener("click", function () {
        var want = t.toLowerCase();
        grid.forEach(function (card) {
          var k = card.getAttribute("data-branza") || "";
          var show = t === "Wszystkie" || k === want;
          card.style.display = (show && card.getAttribute("data-branza") !== null) || t === "Wszystkie" ? "" : "none";
        });
      });
    });
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
