import { sessions, records, booking } from "../web/catalog.mjs";
import { $, escape as e, shell, editor, field, wireReset, notice } from "./ui.js";
const seed = {
  tickets: [{ id: "sample", session: "slow", name: "Alex Morgan", party: 2 }],
  saved: ["tide"],
};
let data = structuredClone(seed),
  tab = "tickets";
function reserve(s) {
  const old = data.tickets.find((t) => t.session === s.id);
  editor(
    s.title,
    `<p>${s.date} NOV · ${s.time}</p><p class="caption">Demo ticket only. No payment or real reservation.</p>` +
      field("Name for demo ticket", "name", old?.name || "Alex Morgan", "text", 60) +
      `<label>Guests<select name="party">${Array.from({ length: Math.min(6, s.seats) }, (_, i) => `<option value="${i + 1}" ${old?.party === i + 1 ? "selected" : ""}>${i + 1} · $${(i + 1) * s.price} demo total</option>`).join("")}</select></label>`,
    (form) => {
      const ticket = booking({
        session: s.id,
        name: form.get("name"),
        party: Number(form.get("party")),
      });
      data.tickets = [
        ...data.tickets.filter((t) => t.session !== s.id),
        { ...ticket, id: old?.id || crypto.randomUUID() },
      ];
      tab = "tickets";
      render();
    },
    old
      ? () => {
          data.tickets = data.tickets.filter((t) => t.session !== s.id);
          render();
        }
      : null,
  );
}
function render() {
  let content = "";
  if (tab === "discover")
    content = `<p class="eyebrow">The November edition / 02</p><h1>WHAT’S<br>ON.</h1><div class="stack">${sessions.map((s) => `<button class="card poster" data-session="${s.id}"><span class="day">${s.date}</span> <span class="eyebrow">NOV / ${s.day}</span><h2>${s.title.toUpperCase()} ↗</h2><div class="spread"><span>${s.genre}</span><span>$${s.price} / person</span></div><p>${s.time}</p></button>`).join("")}</div>`;
  if (tab === "tickets")
    content = `<div class="ticket-head"><p class="eyebrow">SA-02 / MOBILE</p><h1>GOOD<br>NIGHTS<br>AHEAD.</h1><span class="eyebrow">${data.tickets.length} IN YOUR POCKET</span></div><div class="spread section-head"><span class="eyebrow">Your tickets / local demo</span><button data-tab="discover" aria-label="Explore sessions">＋</button></div><div class="stack">${
      data.tickets
        .map((t) => {
          const s = sessions.find((s) => s.id === t.session);
          return `<article class="card ticket"><p class="eyebrow">${s.date} NOV · ${s.day} · DEMO TICKET</p><h2>${s.title}</h2><p>${s.time}</p><p>${e(t.name)} / ${t.party} guest${t.party === 1 ? "" : "s"}</p><div class="stub spread"><span class="eyebrow">NO REAL BOOKING</span><button data-session="${s.id}">Edit ticket</button></div></article>`;
        })
        .join("") ||
      '<p class="empty">Room for another night.<br>Explore sessions to add a demo ticket.</p>'
    }</div><button class="primary section-head" data-tab="discover">Explore sessions ↗</button>`;
  if (tab === "crate")
    content = `<p class="eyebrow">Your record shop finds / ${data.saved.length} saved</p><h1>GOOD<br>FINDS.</h1>${records.map((r) => `<article class="record"><div class="sleeve ${r.id}" aria-hidden="true">${r.title.toUpperCase()}</div><div><h3>${r.title.toUpperCase()}</h3><p class="caption">${r.artist}<br>${r.genre} / ${r.year}</p><button data-record="${r.id}" aria-pressed="${data.saved.includes(r.id)}">${data.saved.includes(r.id) ? "✓ Saved" : "+ Save record"}</button></div></article>`).join("")}`;
  shell(
    '<img class="brand-mark" src="../web/assets/side-a-mark.svg" alt="">SIDE A / POCKET',
    content +
      '<p class="app-note">Fictional sessions and records. Browser preview of the iPhone app. Nothing is purchased, reserved or played. Edits reset when you reload.</p>',
    [
      ["discover", "Discover", tab === "discover"],
      ["tickets", "My tickets", tab === "tickets"],
      ["crate", "My crate", tab === "crate"],
    ],
  );
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        render();
        window.scrollTo(0, 0);
        document.querySelector(`.tabs [data-tab="${tab}"]`).focus();
      }),
  );
  document
    .querySelectorAll("[data-session]")
    .forEach((b) => (b.onclick = () => reserve(sessions.find((s) => s.id === b.dataset.session))));
  document.querySelectorAll("[data-record]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.record;
        data.saved = data.saved.includes(id)
          ? data.saved.filter((v) => v !== id)
          : [...data.saved, id];
        render();
        document.querySelector(`[data-record="${id}"]`).focus();
        notice("Crate updated in this preview.");
      }),
  );
  wireReset(() => {
    data = structuredClone(seed);
    tab = "tickets";
    render();
  });
}
render();
