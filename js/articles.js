/* Artykuły — dane z arkusza Google (Dysk Google → Plik → Udostępnij → Opublikuj w internecie → CSV).
   Kolumny arkusza: tytul | slug | kategoria | data (RRRR-MM-DD) | czas_czytania | zajawka | url | wyrozniony (TAK/NIE) */
(function () {
  "use strict";
  var CONFIG = {
    SHEET_CSV_URL: "" // wklej link CSV z „Opublikuj w internecie"; pusty = karty statyczne z projektu
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
      if (!out && el.children.length === 0 && test((el.textContent || "").trim())) out = el;
    });
    return out;
  }

  function init(arts) {
    var grid = [];
    document.querySelectorAll("div").forEach(function (el) {
      if (/Czytaj więcej/.test(el.textContent || "") && el.children.length >= 4 && el.offsetWidth < 500 && el.offsetWidth > 250) grid.push(el);
    });
    if (!grid.length) return;
    arts.sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); });
    var featured = arts.filter(function (a) { return /^tak$/i.test(a.wyrozniony || ""); })[0] || arts[0];
    var rest = arts.filter(function (a) { return a !== featured; });

    var fTitle = leaf(document.body, function (t) { return /^Jak zaplanować badania UX/.test(t) || t.length > 40 && false; });
    var fWrap = fTitle && fTitle.closest("div");
    if (fTitle && featured) {
      var fScope = fTitle.parentElement;
      fTitle.innerText = featured.tytul;
      var fZaj = leaf(fScope, function (t) { return /Kompletny proces planowania/.test(t); });
      if (fZaj) fZaj.innerText = featured.zajawka || "";
      var fKat = leaf(fScope.parentElement || fScope, function (t) { return t === "BADANIA UX"; });
      if (fKat) fKat.innerText = (featured.kategoria || "").toUpperCase();
      var fMeta = leaf(fScope, function (t) { return /MIN CZYTANIA/.test(t); });
      if (fMeta) fMeta.innerText = fmtDate(featured.data) + "  ·  " + (featured.czas_czytania || "") + " MIN CZYTANIA";
      if (featured.url && fWrap) {
        fScope.style.cursor = "pointer";
        fScope.addEventListener("click", function () { window.open(featured.url, "_self"); });
      }
    }

    grid.forEach(function (card, i) {
      var a = rest[i];
      if (!a) { card.style.display = "none"; return; }
      var meta = leaf(card, function (t) { return /·/.test(t); });
      var kids = Array.prototype.filter.call(card.children, function (c) { return (c.textContent || "").trim(); });
      if (meta) meta.innerText = (a.kategoria || "").toUpperCase() + "  ·  " + fmtDate(a.data) + "  ·  " + (a.czas_czytania || "") + " MIN";
      if (kids[1]) kids[1].innerText = a.tytul || "";
      if (kids[2]) kids[2].innerText = a.zajawka || "";
      card.setAttribute("data-kategoria", (a.kategoria || "").toLowerCase());
      if (a.url) {
        card.style.cursor = "pointer";
        card.addEventListener("click", function () { window.open(a.url, "_self"); });
      }
    });

    document.querySelectorAll("div").forEach(function (chip) {
      var t = (chip.textContent || "").trim();
      if (chip.children.length !== 1 || chip.offsetHeight > 60 || chip.offsetHeight < 30) return;
      if (!/^(Wszystkie|Badania UX|Segmentacja|Audyt UX|Strategia|Narzędzia)$/.test(t)) return;
      chip.style.cursor = "pointer";
      chip.addEventListener("click", function () {
        var want = t.toLowerCase();
        grid.forEach(function (card) {
          var k = card.getAttribute("data-kategoria") || "";
          var show = t === "Wszystkie" || k.indexOf(want) !== -1 || want.indexOf(k) !== -1 && k;
          card.style.display = (show && card.getAttribute("data-kategoria") !== null) || t === "Wszystkie" ? "" : "none";
        });
      });
    });
  }

  if (!/artykuly\.html/.test(location.pathname)) return;
  if (!CONFIG.SHEET_CSV_URL) return;
  fetch(CONFIG.SHEET_CSV_URL)
    .then(function (r) { return r.text(); })
    .then(function (t) { init(toObjects(parseCSV(t))); })
    .catch(function (e) { console.warn("Artykuły: nie udało się pobrać arkusza", e); });
})();
