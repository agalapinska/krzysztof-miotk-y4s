/* Y4S — wersja poprawiona: interakcje */

const CONFIG = {
  formEndpoint: "",   // Formspree — do uzupełnienia
  calendarUrl: "",    // Calendly — do uzupełnienia
  contactEmail: "kontakt@krzysztofmiotk.pl",
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Reveal on scroll ---------- */
(() => {
  const items = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- Count-up stats ---------- */
(() => {
  const nums = document.querySelectorAll("[data-count]");
  if (!nums.length || reducedMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const dur = 1200;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  nums.forEach((el) => io.observe(el));
})();

/* ---------- FAQ accordion ---------- */
(() => {
  document.querySelectorAll(".faq__item").forEach((item) => {
    const btn = item.querySelector(".faq__q");
    const panel = item.querySelector(".faq__a");
    const sync = () => {
      const open = item.classList.contains("is-open");
      btn.setAttribute("aria-expanded", String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0";
    };
    btn.addEventListener("click", () => {
      document.querySelectorAll(".faq__item.is-open").forEach((other) => {
        if (other !== item) {
          other.classList.remove("is-open");
          other.querySelector(".faq__q").setAttribute("aria-expanded", "false");
          other.querySelector(".faq__a").style.maxHeight = "0";
        }
      });
      item.classList.toggle("is-open");
      sync();
    });
    sync();
  });
})();

/* ---------- Historie klientów: slider ---------- */
(() => {
  const CASES = [
    {
      tag: "CASE STUDY / FINTECH", brand: "Gemini",
      title: "Jak badania odblokowały decyzje produktowe w aplikacji inwestycyjnej",
      desc: "Seria wywiadów pogłębionych i testów użyteczności, które przełożyły się na przeprojektowanie kluczowego przepływu — od onboardingu po pierwszą transakcję.",
      nextTag: "NASTĘPNY / E-COMMERCE", nextTitle: "XTB — jak szybkość interfejsu przełożyła się na wynik",
      nextDesc: "Optymalizacja krytycznych ścieżek na podstawie badań i danych.",
    },
    {
      tag: "CASE STUDY / E-COMMERCE", brand: "XTB",
      title: "Jak szybkość interfejsu przełożyła się na wynik finansowy",
      desc: "Optymalizacja krytycznych ścieżek na podstawie badań i twardych danych — milisekundy, które zamieniły się w realne pieniądze.",
      nextTag: "NASTĘPNY / MARKETPLACE", nextTitle: "OLX — segmentacja, która uporządkowała roadmapę",
      nextDesc: "Badania ilościowe i jakościowe jako podstawa priorytetów produktowych.",
    },
    {
      tag: "CASE STUDY / MARKETPLACE", brand: "OLX",
      title: "Segmentacja klientów, która uporządkowała roadmapę produktu",
      desc: "Połączenie danych behawioralnych z wywiadami pozwoliło zespołowi skupić się na segmentach o największym potencjale wzrostu.",
      nextTag: "NASTĘPNY / FINTECH", nextTitle: "Gemini — badania, które odblokowały decyzje produktowe",
      nextDesc: "Wywiady pogłębione i testy użyteczności w aplikacji inwestycyjnej.",
    },
  ];
  let idx = 0;
  const fields = document.querySelectorAll("[data-case]");
  const dots = document.querySelectorAll(".cases__progress i");
  if (!fields.length) return;
  const render = () => {
    const c = CASES[idx];
    fields.forEach((el) => {
      const key = el.dataset.case;
      if (key === "count") {
        el.textContent = String(idx + 1).padStart(2, "0") + " / " + String(CASES.length).padStart(2, "0");
      } else if (c[key] !== undefined) {
        el.textContent = c[key];
      }
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  };
  const prevBtn = document.querySelector("[data-case-prev]");
  const nextBtn = document.querySelector("[data-case-next]");
  prevBtn?.addEventListener("click", () => { idx = (idx - 1 + CASES.length) % CASES.length; render(); });
  nextBtn?.addEventListener("click", () => { idx = (idx + 1) % CASES.length; render(); });
  render();
})();

/* ---------- Newsletter ---------- */
(() => {
  const form = document.querySelector("[data-newsletter]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = document.querySelector("[data-newsletter-ok]");
    if (ok) ok.style.display = "block";
    form.reset();
  });
})();

/* ---------- Formularz kontaktowy ---------- */
(() => {
  const form = document.querySelector("[data-contact]");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (CONFIG.formEndpoint) {
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.innerHTML = '<p style="color:#a399fd;font-weight:600;">Dzięki! Odezwę się w ciągu 24 godzin.</p>';
          return;
        }
      } catch (_) { /* fallback niżej */ }
    }
    const subject = encodeURIComponent("Pytanie ze strony — " + (data.get("name") || ""));
    const body = encodeURIComponent((data.get("message") || "") + "\n\n— " + (data.get("name") || "") + " <" + (data.get("email") || "") + ">");
    window.location.href = "mailto:" + CONFIG.contactEmail + "?subject=" + subject + "&body=" + body;
  });
})();
