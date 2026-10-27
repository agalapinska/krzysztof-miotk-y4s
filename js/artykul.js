/* Pełna treść artykułu z arkusza Google (zakładka „Tresci").
   Format treści: puste linie rozdzielają akapity, „## ” zaczyna śródtytuł,
   linie „- ” tworzą listę, **pogrubienie** działa w akapitach i listach. */
(function () {
  "use strict";
  var SHEET = "https://docs.google.com/spreadsheets/d/1sxqitjESZckLXDduOcaM3FIkbyvKlIe5VNhwG-dSYdw/export?format=csv";
  var GID_META = "0";

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
  function docLink(s) {
    return /^https:\/\/docs\.google\.com\/document\//.test((s || "").trim());
  }
  function pickTresc(t) {
    if (!t) return "";
    return docLink(t.tresc) ? (t.tresc_md || "").trim() : (t.tresc || "").trim();
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function rich(s) {
    var nb = /(^|[\s („>])([aiouwzAIOUWZ]) /g;
    s = s.replace(nb, "$1$2 ").replace(nb, "$1$2 ");
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  if (!/artykul\.html/.test(location.pathname)) return;
  var slug = new URLSearchParams(location.search).get("slug") || "";
  if (!slug) { location.replace("artykuly.html"); return; }

  fetch(SHEET + "&gid=" + GID_META).then(function (r) { return r.text(); }).then(function (text) {
    var all = toObjects(parseCSV(text)).filter(function (a) { return a.tytul && a.slug; });
    var meta = all.filter(function (a) { return a.slug === slug; })[0];
    var body = pickTresc(meta);
    if (!meta || !body) { location.replace("artykuly.html"); return; }

    document.title = meta.tytul_seo || (meta.tytul + " — Krzysztof Miotk");
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", meta.opis_seo || meta.zajawka || "");
    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://krzysztofmiotk.pl/artykul.html?slug=" + encodeURIComponent(slug);
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Article",
      "headline": meta.tytul, "datePublished": meta.data,
      "articleSection": meta.kategoria, "description": meta.opis_seo || meta.zajawka || "",
      "author": { "@type": "Person", "name": "Krzysztof Miotk", "jobTitle": "UX Researcher" }
    });
    document.head.appendChild(ld);

    var hdr = document.querySelector('[data-pencil-name="Artykuł Header"]');
    var bodyC = document.querySelector('[data-pencil-name="Artykuł Body"]');
    if (!hdr || !bodyC) return;
    var bc3 = document.querySelector('[data-pencil-name="bc3"]');
    if (bc3) bc3.innerText = meta.tytul.length > 46 ? meta.tytul.slice(0, 44) + "…" : meta.tytul;
    var kat = document.querySelector('[data-pencil-name="KatT"]');
    if (kat) kat.innerText = (meta.kategoria || "").toUpperCase();
    var dt = document.querySelector('[data-pencil-name="DataT"]');
    if (dt) dt.innerText = fmtDate(meta.data) + "  ·  " + (meta.czas_czytania || "") + " MIN CZYTANIA";
    var h1 = document.querySelector('[data-pencil-name="H1"]');
    if (h1) h1.innerHTML = rich(meta.tytul);

    var tplP = bodyC.querySelector('[data-pencil-name="p"]');
    var tplH2 = bodyC.querySelector('[data-pencil-name="h2"]');
    var tplLi = bodyC.querySelector('[data-pencil-name="li"]');
    var mk = {
      p: function (txt) { var el = tplP.cloneNode(false); el.innerHTML = rich(txt); return el; },
      h2: function (txt) { var el = tplH2.cloneNode(false); el.innerHTML = rich(txt); el.style.paddingTop = "14px"; return el; },
      li: function (txt) {
        var el = tplLi.cloneNode(true);
        var t = el.querySelector('[data-pencil-name="liT"]');
        if (t) t.innerHTML = rich(txt);
        return el;
      }
    };
    while (bodyC.firstChild) bodyC.removeChild(bodyC.firstChild);
    body.split(/\n\s*\n/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      if (block.indexOf("## ") === 0) { bodyC.appendChild(mk.h2(block.slice(3))); return; }
      var lines = block.split("\n");
      var isList = lines.every(function (l) { return /^- /.test(l.trim()); });
      if (isList) {
        lines.forEach(function (l) { bodyC.appendChild(mk.li(l.trim().slice(2))); });
        return;
      }
      lines.forEach(function (l) {
        if (/^## /.test(l)) bodyC.appendChild(mk.h2(l.slice(3)));
        else if (/^- /.test(l.trim())) bodyC.appendChild(mk.li(l.trim().slice(2)));
        else bodyC.appendChild(mk.p(l));
      });
    });

    /* „Kolejne" (wg XMAtc): następne pozycje po bieżącej, zapętlone, karty klikalne */
    var seq = all.slice().sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); });
    var ci = -1;
    seq.forEach(function (a, i) { if (a.slug === slug) ci = i; });
    var cards = document.querySelectorAll('[data-pencil-name^="Artykuł: "]');
    var next = [];
    for (var k = 1; k <= seq.length - 1 && next.length < cards.length; k++) {
      var cand = seq[(ci + k + seq.length) % seq.length];
      if (pickTresc(cand) || cand.url) next.push(cand);
    }
    Array.prototype.forEach.call(cards, function (card, i) {
      var a = next[i];
      if (!a) { card.style.display = "none"; return; }
      var mEl = card.querySelector('[data-pencil-name="Meta"]');
      var tEl = card.querySelector('[data-pencil-name="Tytuł"]');
      var zEl = card.querySelector('[data-pencil-name="Zajawka"]');
      if (mEl) mEl.innerText = (a.kategoria || "").toUpperCase() + "  ·  " + fmtDate(a.data) + "  ·  " + (a.czas_czytania || "") + " MIN";
      if (tEl) tEl.innerText = a.tytul;
      if (zEl) zEl.innerText = a.zajawka || "";
      card._kmHref = pickTresc(a) ? "artykul.html?slug=" + encodeURIComponent(a.slug) : (a.url || "");
      card.style.cursor = "pointer";
      if (!card._kmNext) {
        card._kmNext = 1;
        card.addEventListener("click", function () { if (card._kmHref) window.location.href = card._kmHref; });
      }
    });
  }).catch(function (e) {
    console.warn("Artykuł: nie udało się pobrać treści —", e.message || e);
  });
})();
