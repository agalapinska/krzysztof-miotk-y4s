/**
 * CMS strony krzysztof-miotk — skrypt arkusza „Artykuły_CMS"
 * =========================================================
 *
 * Dodaje w Arkuszu menu „🚀 CMS" z akcjami:
 *   • Publikuj (synchronizuj + deploy)  — jedno kliknięcie: pobiera treści
 *     z podlinkowanych Google Docs i przebudowuje stronę na GitHub Pages
 *   • Synchronizuj treści z Google Docs — sama konwersja Doców do kolumny tresc_md
 *   • Deploy strony                     — sama przebudowa GitHub Pages
 *   • Status ostatniego deployu
 *   • Ustaw token GitHub…
 *
 * JAK DZIAŁA TREŚĆ Z GOOGLE DOCS
 * ------------------------------
 * W kartach „Tresci" i „Case_study_tresci" w kolumnie `tresc` można zamiast
 * tekstu wkleić link udostępniania do Google Doca
 * (https://docs.google.com/document/d/…). Po kliknięciu „Publikuj" skrypt
 * otwiera każdego podlinkowanego Doca, konwertuje jego formatowanie
 * (nagłówki → „## ", pogrubienia → **…**, listy → „- ") i zapisuje wynik
 * w kolumnie `tresc_md`, którą czyta strona. Link w `tresc` zostaje —
 * wystarczy edytować Doca i ponownie kliknąć „Publikuj".
 *
 * INSTALACJA (raz)
 * ----------------
 * 1. W arkuszu: Rozszerzenia → Apps Script.
 * 2. Usuń zawartość pliku Code.gs i wklej całą zawartość tego pliku. Zapisz (⌘S).
 * 3. Wróć do arkusza i odśwież kartę — pojawi się menu „🚀 CMS".
 * 4. Pierwsze użycie dowolnej akcji poprosi o autoryzację (konto Google,
 *    zgody: Arkusze, Dokumenty, połączenia zewnętrzne). To standardowe
 *    uprawnienia skryptu działającego na Twoim koncie.
 * 5. „🚀 CMS → Ustaw token GitHub…" i wklej token:
 *    GitHub → Settings → Developer settings → Fine-grained personal access
 *    tokens → Generate new token → Repository: krzysztof-miotk-y4s →
 *    Permissions → Pages: Read and write. Token zapisuje się tylko dla
 *    Twojego konta (UserProperties), inni edytorzy arkusza go nie widzą.
 *
 * Uwaga: treści i tak są czytane przez stronę na żywo z arkusza, więc nowy
 * artykuł pojawia się bez deployu. „Deploy" odświeża statyczny hosting
 * (przyda się po zmianach w kodzie strony albo gdy w przyszłości dojdzie
 * prerender artykułów pod SEO).
 */

var CFG = {
  GH_OWNER: "agalapinska",
  GH_REPO: "krzysztof-miotk-y4s",
  CONTENT_SHEETS: ["Tresci", "Case_study_tresci"],
  COL_SLUG: 1,      // A
  COL_TRESC: 4,     // D — tekst albo link do Google Doca
  COL_TRESC_MD: 5   // E — wynik konwersji (zarządzany przez skrypt)
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 CMS")
    .addItem("Publikuj (synchronizuj + deploy)", "publishAll")
    .addItem("Synchronizuj treści z Google Docs", "syncDocsMenu")
    .addItem("Deploy strony (przebuduj GitHub Pages)", "deploySite")
    .addSeparator()
    .addItem("Status ostatniego deployu", "deployStatus")
    .addItem("Ustaw token GitHub…", "setGithubToken")
    .addToUi();
}

function publishAll() {
  var report = syncDocs();
  var deployed = deploySite(true);
  SpreadsheetApp.getUi().alert(
    "Publikacja",
    report + "\n\n" + deployed,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function syncDocsMenu() {
  SpreadsheetApp.getUi().alert("Synchronizacja", syncDocs(), SpreadsheetApp.getUi().ButtonSet.OK);
}

/* --- Synchronizacja: Google Doc → markdown-lite w kolumnie tresc_md --- */

function syncDocs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var done = [], errors = [];
  CFG.CONTENT_SHEETS.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { errors.push(name + ": brak karty"); return; }
    ensureTrescMdHeader(sh);
    var last = sh.getLastRow();
    if (last < 2) return;
    var rows = sh.getRange(2, 1, last - 1, CFG.COL_TRESC_MD).getValues();
    rows.forEach(function (row, i) {
      var slug = String(row[CFG.COL_SLUG - 1] || "").trim();
      var tresc = String(row[CFG.COL_TRESC - 1] || "").trim();
      var docId = extractDocId(tresc);
      if (!slug || !docId) return;
      try {
        var md = docToMarkdown(DocumentApp.openById(docId));
        sh.getRange(i + 2, CFG.COL_TRESC_MD).setValue(md);
        done.push(name + " / " + slug);
      } catch (e) {
        errors.push(name + " / " + slug + ": " + (e && e.message ? e.message : e));
      }
    });
  });
  var msg = done.length
    ? "Zsynchronizowano " + done.length + " treści z Google Docs:\n• " + done.join("\n• ")
    : "Brak wierszy z linkami do Google Docs — nic do synchronizacji.";
  if (errors.length) msg += "\n\nBłędy:\n• " + errors.join("\n• ");
  return msg;
}

function ensureTrescMdHeader(sh) {
  if (sh.getMaxColumns() < CFG.COL_TRESC_MD) {
    sh.insertColumnsAfter(sh.getMaxColumns(), CFG.COL_TRESC_MD - sh.getMaxColumns());
  }
  var h = sh.getRange(1, CFG.COL_TRESC_MD);
  if (String(h.getValue()).trim() !== "tresc_md") h.setValue("tresc_md");
}

function extractDocId(s) {
  var m = /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/.exec(s);
  return m ? m[1] : null;
}

function docToMarkdown(doc) {
  var body = doc.getBody();
  var blocks = [], listBuf = [];
  function flushList() {
    if (listBuf.length) { blocks.push(listBuf.join("\n")); listBuf = []; }
  }
  for (var i = 0; i < body.getNumChildren(); i++) {
    var el = body.getChild(i);
    var type = el.getType();
    if (type === DocumentApp.ElementType.LIST_ITEM) {
      var li = runsToMd(el.asListItem().editAsText());
      if (li.trim()) listBuf.push("- " + li.trim());
      continue;
    }
    flushList();
    if (type !== DocumentApp.ElementType.PARAGRAPH) continue;
    var p = el.asParagraph();
    var heading = p.getHeading();
    if (heading !== DocumentApp.ParagraphHeading.NORMAL) {
      var ht = p.getText().trim();
      if (ht) blocks.push("## " + ht);
    } else {
      var txt = runsToMd(p.editAsText());
      if (txt.trim()) blocks.push(txt.trim());
    }
  }
  flushList();
  return blocks.join("\n\n");
}

function runsToMd(textEl) {
  var s = textEl.getText();
  if (!s) return "";
  var idx = textEl.getTextAttributeIndices();
  var out = "";
  for (var i = 0; i < idx.length; i++) {
    var start = idx[i];
    var end = i + 1 < idx.length ? idx[i + 1] : s.length;
    var chunk = s.substring(start, end);
    if (textEl.isBold(start) && chunk.trim()) {
      var lead = chunk.match(/^\s*/)[0];
      var trail = chunk.match(/\s*$/)[0];
      out += lead + "**" + chunk.trim() + "**" + trail;
    } else {
      out += chunk;
    }
  }
  return out;
}

/* --- Deploy: przebudowa GitHub Pages --- */

function deploySite(quiet) {
  var token = PropertiesService.getUserProperties().getProperty("GH_TOKEN");
  if (!token) {
    var msg = "Brak tokenu GitHub — użyj „🚀 CMS → Ustaw token GitHub…".";
    if (!quiet) SpreadsheetApp.getUi().alert(msg);
    return msg;
  }
  var resp = UrlFetchApp.fetch(
    "https://api.github.com/repos/" + CFG.GH_OWNER + "/" + CFG.GH_REPO + "/pages/builds",
    {
      method: "post",
      headers: ghHeaders(token),
      muteHttpExceptions: true
    }
  );
  var code = resp.getResponseCode();
  var msg = code === 201
    ? "Deploy zlecony ✅ — GitHub Pages przebuduje stronę w ~1-2 min."
    : "Deploy nieudany (HTTP " + code + "): " + resp.getContentText().slice(0, 300);
  if (!quiet) SpreadsheetApp.getActiveSpreadsheet().toast(msg, "CMS", 8);
  return msg;
}

function deployStatus() {
  var token = PropertiesService.getUserProperties().getProperty("GH_TOKEN");
  if (!token) { SpreadsheetApp.getUi().alert("Brak tokenu GitHub — użyj „Ustaw token GitHub…"."); return; }
  var resp = UrlFetchApp.fetch(
    "https://api.github.com/repos/" + CFG.GH_OWNER + "/" + CFG.GH_REPO + "/pages/builds/latest",
    { headers: ghHeaders(token), muteHttpExceptions: true }
  );
  var msg;
  try {
    var b = JSON.parse(resp.getContentText());
    msg = "Status: " + b.status + "\nZaktualizowano: " + b.updated_at +
      (b.error && b.error.message ? "\nBłąd: " + b.error.message : "");
  } catch (e) {
    msg = "Nie udało się odczytać statusu (HTTP " + resp.getResponseCode() + ").";
  }
  SpreadsheetApp.getUi().alert("Ostatni deploy", msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function setGithubToken() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt(
    "Token GitHub",
    "Wklej fine-grained personal access token z uprawnieniem Pages: Read and write dla repo " +
      CFG.GH_OWNER + "/" + CFG.GH_REPO + ".\nToken zapisze się tylko dla Twojego konta Google.",
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var t = r.getResponseText().trim();
  if (!t) { ui.alert("Pusty token — nic nie zapisano."); return; }
  PropertiesService.getUserProperties().setProperty("GH_TOKEN", t);
  ui.alert("Token zapisany ✅");
}

function ghHeaders(token) {
  return {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
