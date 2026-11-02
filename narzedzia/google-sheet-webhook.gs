/**
 * Webhook formularzy krzysztofmiotk.pl → Google Sheets (karty „Kontakty" i „Wyceny").
 *
 * INSTALACJA (ok. 2 minuty):
 * 1. Otwórz arkusz „Artykuły_CMS" (ten z artykułami/case'ami).
 * 2. Rozszerzenia → Apps Script → wklej CAŁY ten plik (zastąp zawartość) → zapisz.
 * 3. Wdróż → Nowe wdrożenie → typ: Aplikacja internetowa:
 *    - Wykonuj jako: Ja
 *    - Dostęp: Każdy
 * 4. Skopiuj „Adres URL aplikacji internetowej" (kończy się na /exec)
 *    i podeślij go — podepnę go w js/pen-fx.js (stała FORMS_WEBHOOK).
 */
function doPost(e) {
  var p = (e && e.parameter) || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = Utilities.formatDate(new Date(), "Europe/Warsaw", "yyyy-MM-dd HH:mm:ss");
  if (p.form === "wycena") {
    ss.getSheetByName("Wyceny").appendRow([
      now, p.imie_nazwisko || "", p.email || "", p.stanowisko || "",
      p.usluga || "", p.cel_biznesowy || "", p.grupa_docelowa || "", p.opis || "", p.zrodlo || ""
    ]);
  } else {
    ss.getSheetByName("Kontakty").appendRow([
      now, p.imie || "", p.email || "", p.strona_www || "", p.wiadomosc || "", p.zrodlo || ""
    ]);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
