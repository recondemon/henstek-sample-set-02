import { sessions, records, booking, savedRecords } from "./catalog.mjs";
const $ = (s) => document.querySelector(s),
  dialog = $("#booking-dialog"),
  form = $("#booking-form");
const keys = { ticket: "side-a-web-ticket-v1", crate: "side-a-web-crate-v1" };
let ticket = null,
  crate = [],
  blocked = false,
  toastTimer;
try {
  const t = localStorage.getItem(keys.ticket),
    c = localStorage.getItem(keys.crate);
  if (t) {
    const stored = JSON.parse(t);
    if (stored.version !== 1 || stored.demo !== true) throw Error("Unsupported saved ticket.");
    ticket = booking(stored);
  }
  if (c) crate = savedRecords(JSON.parse(c));
} catch {
  blocked = true;
  toast("Saved data could not be read. Existing data is preserved; this visit is read-only.");
}
function toast(message) {
  $("#toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").textContent = ""), 6000);
}
function persist(key, value) {
  if (blocked)
    throw Error(
      "Saved data needs recovery. Export or preserve it before clearing browser storage.",
    );
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}
function renderSessions(filter = "all") {
  $("#sessions").replaceChildren();
  for (const s of sessions.filter((s) => filter === "all" || s.genre.includes(filter))) {
    const row = document.createElement("article");
    row.className = "session";
    row.innerHTML = `<div class="date"><span>${s.day}</span><strong>${s.date}</strong><span>${s.month}</span></div><div><span class="tag">${s.genre}</span><h3>${s.title}</h3><p>${s.host}</p></div><div class="session-meta"><p>${s.time}</p><p>${s.seats} demo seats · $${s.price} / person</p></div><button aria-label="Book ${s.title}">Find a seat <span>↗</span></button>`;
    row.querySelector("button").onclick = () => openBooking(s.id);
    $("#sessions").append(row);
  }
}
function renderRecords() {
  $("#record-grid").replaceChildren();
  for (const r of records) {
    const article = document.createElement("article");
    article.innerHTML = `<div class="sleeve ${r.color}"><span>SIDE A SELECTS / ${r.year}</span><h3>${r.title}</h3><span>${r.genre} / 33⅓ RPM</span></div><div class="record-footer"><div><strong>${r.title}</strong><p>${r.artist}</p></div><button class="save-record" data-record="${r.id}" aria-label="${crate.includes(r.id) ? "Unsave" : "Save"} ${r.title}" aria-pressed="${crate.includes(r.id)}">${crate.includes(r.id) ? "Saved ✓" : "Save +"}</button></div>`;
    article.querySelector("button").onclick = () => {
      try {
        const next = crate.includes(r.id) ? crate.filter((id) => id !== r.id) : [...crate, r.id];
        persist(keys.crate, next);
        crate = next;
        renderRecords();
        document.querySelector(`[data-record="${r.id}"]`).focus();
      } catch (e) {
        toast(e.message);
      }
    };
    $("#record-grid").append(article);
  }
  $("#crate-count").textContent = `Your crate · ${crate.length} saved`;
}
function showTicket() {
  form.hidden = true;
  $("#ticket").hidden = false;
  const s = sessions.find((s) => s.id === ticket.session);
  $("#dialog-title").textContent = "You’re on the list.";
  $("#ticket-title").textContent = s.title;
  $("#ticket-details").textContent =
    `${ticket.name} · ${ticket.party} guest${ticket.party > 1 ? "s" : ""}
${s.day} ${s.date} ${s.month} · ${s.time}
Illustrative total $${ticket.total} · No payment taken`;
  $("#session-summary").textContent = "Saved locally. No real reservation has been made.";
}
function openBooking(id) {
  $("#booking-status").textContent = "";
  if (id) {
    form.hidden = false;
    $("#ticket").hidden = true;
    $("#dialog-title").textContent = "Find your seat.";
    form.elements.session.value = id;
    updateTotal();
  } else if (ticket) showTicket();
  else {
    form.hidden = false;
    $("#ticket").hidden = true;
    $("#dialog-title").textContent = "Find your seat.";
    updateTotal();
  }
  dialog.showModal();
}
function updateTotal() {
  const s = sessions.find((s) => s.id === form.elements.session.value);
  $("#session-summary").textContent =
    `${s.day} ${s.date} ${s.month} · ${s.time} · ${s.seats} demo seats`;
  const max = Math.min(6, s.seats);
  for (const o of form.elements.party.options) o.disabled = Number(o.value) > max;
  if (Number(form.elements.party.value) > max) form.elements.party.value = String(max);
  $("#total").textContent = "$" + s.price * Number(form.elements.party.value);
}
form.elements.session.innerHTML = sessions
  .map((s) => `<option value="${s.id}">${s.title}</option>`)
  .join("");
form.onchange = updateTotal;
form.onsubmit = (e) => {
  e.preventDefault();
  try {
    const next = booking({
      session: form.elements.session.value,
      name: form.elements.name.value,
      party: Number(form.elements.party.value),
    });
    persist(keys.ticket, next);
    ticket = next;
    $("#booking-dot").textContent = "●";
    showTicket();
    $("#export-ticket").focus();
  } catch (e) {
    $("#booking-status").textContent = e.message;
  }
};
$("#my-booking").onclick = () => openBooking();
$(".close").onclick = () => dialog.close();
$("#cancel-ticket").onclick = () => {
  try {
    persist(keys.ticket, null);
    ticket = null;
    $("#booking-dot").textContent = "";
    dialog.close();
    toast("Demo booking canceled.");
  } catch (e) {
    $("#booking-status").textContent = e.message;
  }
};
$("#export-ticket").onclick = () => {
  if (!ticket) return;
  const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "side-a-demo-ticket.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
for (const button of document.querySelectorAll("[data-filter]"))
  button.onclick = () => {
    for (const b of document.querySelectorAll("[data-filter]")) {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    }
    renderSessions(button.dataset.filter);
  };
renderSessions();
renderRecords();
updateTotal();
if (ticket) $("#booking-dot").textContent = "●";
