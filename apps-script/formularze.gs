/**
 * Formularze strony krzysztofmiotk.pl → arkusz „Formularze_KMiotk"
 * ================================================================
 *
 * Strona jest statyczna (GitHub Pages), więc sama nie zapisze nic do Arkusza.
 * Czytanie danych działa bez niczego, bo arkusz CMS jest udostępniony publicznie
 * i strona pobiera go jako CSV. Zapis to inna sprawa: Google wymaga
 * uwierzytelnienia, a w kodzie strony nie ma gdzie bezpiecznie trzymać klucza —
 * wszystko, co trafi do JavaScriptu, widzi każdy odwiedzający i mógłby tym
 * pisać do arkusza albo go wyczyścić.
 *
 * Ten skrypt jest tym brakującym pośrednikiem. Działa po stronie Google, na
 * koncie właściciela arkusza, i przyjmuje zgłoszenia z formularzy.
 *
 * INSTALACJA (raz, około 2 minuty)
 * --------------------------------
 * 1. Otwórz arkusz „Formularze_KMiotk":
 *    https://docs.google.com/spreadsheets/d/15rQR7SxOAWmD2CYGa32xUERt-7aH4J34SLht35ntTMQ/edit
 * 2. Rozszerzenia → Apps Script.
 * 3. Usuń zawartość pliku Code.gs i wklej całą zawartość tego pliku. Zapisz (⌘S).
 * 4. Wdróż → Nowe wdrożenie → koło zębate → Aplikacja internetowa.
 *    - Wykonaj jako: Ja
 *    - Kto ma dostęp: Wszyscy
 *    (To są konieczne ustawienia: strona wysyła zgłoszenia anonimowo, a dopisać
 *    je do arkusza może tylko skrypt działający na Twoim koncie.)
 * 5. Wdróż. Pierwsze wdrożenie poprosi o autoryzację — to standardowa zgoda dla
 *    skryptu działającego na Twoim koncie.
 * 6. Skopiuj adres kończący się na /exec i wklej go w js/pen-fx.js jako
 *    wartość KM_FORMS_URL.
 *
 * Po zmianie kodu skryptu: Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa
 * → Wdróż. Adres /exec zostaje ten sam.
 */

var SHEET_ID = "15rQR7SxOAWmD2CYGa32xUERt-7aH4J34SLht35ntTMQ";
var TAB = "Zgloszenia";

/* Kolejność kolumn w arkuszu. Pola spoza tej listy trafiają do „wiadomosc". */
var COLS = ["data", "formularz", "strona", "imie", "email", "telefon", "firma",
            "temat", "wiadomosc", "budzet", "zgoda", "zrodlo", "status", "notatki"];

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB);
    if (!sheet) return json({ ok: false, error: "Brak karty " + TAB });

    var row = COLS.map(function (c) {
      if (c === "data") return new Date();
      if (c === "status" || c === "notatki") return "";
      return p[c] || "";
    });

    /* Pola, których nie ma w nagłówkach, dopisujemy na końcu „wiadomosc",
       żeby nic ze zgłoszenia nie przepadło. */
    var extra = [];
    Object.keys(p).forEach(function (k) {
      if (COLS.indexOf(k) === -1) extra.push(k + ": " + p[k]);
    });
    if (extra.length) {
      var i = COLS.indexOf("wiadomosc");
      row[i] = (row[i] ? row[i] + "\n\n" : "") + extra.join("\n");
    }

    sheet.appendRow(row);
    notify(p, row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* Wejście przeglądarką — żeby dało się sprawdzić, że wdrożenie żyje. */
function doGet() {
  return json({ ok: true, info: "Endpoint formularzy krzysztofmiotk.pl dziala." });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Powiadomienie mailem o nowym zgłoszeniu. Pusty adres wyłącza powiadomienia. */
var NOTIFY_TO = "krzysiek@quale.agency";

function notify(p, row) {
  if (!NOTIFY_TO) return;
  try {
    var tresc = COLS.map(function (c, i) {
      if (c === "status" || c === "notatki" || !row[i]) return null;
      return c + ": " + row[i];
    }).filter(String).join("\n");
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: "Nowe zgłoszenie ze strony: " + (p.formularz || "formularz"),
      body: tresc + "\n\nArkusz: https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit",
      replyTo: p.email || undefined
    });
  } catch (err) {
    /* Powiadomienie nie może wywrócić zapisu zgłoszenia. */
  }
}
