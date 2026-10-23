const { seed, sessions, validate, totals } = SideAModel,
  $ = (s) => document.querySelector(s),
  key = "side-a-desk-v1",
  previousKey = "side-a-desk-previous-v1";
let data,
  session = "slow",
  editing = null,
  blocked = false,
  busy = false,
  replace = null;
const native = !!window.venueStore;
$("#storage-mode").textContent = native ? "Private local file" : "Local browser preview";
function message(text) {
  $("#message").textContent = text;
}
async function load() {
  try {
    if (native) data = validate(await window.venueStore.load());
    else {
      const raw = localStorage.getItem(key);
      data = raw ? validate(JSON.parse(raw)) : structuredClone(seed);
    }
  } catch (e) {
    blocked = true;
    data = { version: 1, guests: [] };
    message("Saved data needs recovery. Existing data has been preserved. " + e.message);
  }
  render();
}
async function save(next) {
  if (blocked)
    throw Error("Recovery is required before saving. Existing data has not been overwritten.");
  if (busy) throw Error("Wait for the current save to finish.");
  busy = true;
  try {
    const clean = validate(next);
    if (native) await window.venueStore.save(clean);
    else {
      const old = localStorage.getItem(key);
      if (old) localStorage.setItem(previousKey, old);
      localStorage.setItem(key, JSON.stringify(clean));
    }
    data = clean;
    render();
    message("Saved locally.");
  } finally {
    busy = false;
  }
}
function render() {
  const s = sessions.find((s) => s.id === session),
    t = totals(data.guests, session);
  $("#session-date").textContent = s.day + " / SAMPLE PROGRAMME";
  $("#session-name").textContent = s.title;
  $("#session-time").textContent = s.time + " · Fictional listening session";
  $("#reserved").textContent = t.reserved;
  $("#capacity-total").textContent = "/ " + s.capacity + " seats";
  $("#meter-fill").style.width = (t.reserved / s.capacity) * 100 + "%";
  $("#capacity-caption").textContent = s.capacity - t.reserved + " seats available";
  $("#arrived").textContent = t.arrived;
  for (const b of document.querySelectorAll("[data-session]"))
    b.setAttribute("aria-pressed", String(b.dataset.session === session));
  const q = $("#search").value.toLowerCase(),
    status = $("#filter").value,
    rows = data.guests.filter(
      (g) =>
        g.session === session &&
        (status === "all" || status === g.status) &&
        (g.name + " " + g.note).toLowerCase().includes(q),
    );
  $("#count").textContent = rows.length + (rows.length === 1 ? " party" : " parties");
  $("#empty").hidden = rows.length > 0;
  $("#guests").replaceChildren();
  for (const g of rows) {
    const tr = document.createElement("tr");
    const name = document.createElement("td"),
      strong = document.createElement("strong"),
      note = document.createElement("p");
    strong.textContent = g.name;
    note.textContent = g.note || "No special notes";
    name.append(strong, note);
    const party = document.createElement("td");
    party.textContent = String(g.party).padStart(2, "0");
    const state = document.createElement("td"),
      badge = document.createElement("span");
    badge.className = "status " + g.status;
    badge.textContent = { booked: "Expected", arrived: "Arrived", canceled: "Canceled" }[g.status];
    state.append(badge);
    const actions = document.createElement("td");
    if (g.status !== "canceled") {
      const check = document.createElement("button");
      check.textContent = g.status === "arrived" ? "Undo arrival" : "Check in";
      check.setAttribute("aria-label", check.textContent + " " + g.name);
      check.disabled = blocked;
      check.dataset.guest = g.id;
      check.onclick = async () => {
        try {
          await save({
            ...data,
            guests: data.guests.map((row) =>
              row.id === g.id
                ? { ...row, status: row.status === "arrived" ? "booked" : "arrived" }
                : row,
            ),
          });
          document.querySelector(`[data-guest="${g.id}"]`)?.focus();
        } catch (e) {
          message(e.message);
        }
      };
      actions.append(check);
    }
    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", "Edit " + g.name);
    edit.disabled = blocked;
    edit.onclick = () => openEditor(g);
    actions.append(edit);
    tr.append(name, party, state, actions);
    $("#guests").append(tr);
  }
  $("#add").disabled = blocked;
  $("#reset").disabled = blocked;
  $("#import").disabled = blocked;
  $("#export").disabled = blocked;
}
function openEditor(g) {
  editing = g?.id ?? null;
  const f = $("#edit-form");
  f.reset();
  f.elements.name.value = g?.name ?? "";
  f.elements.party.value = g?.party ?? 2;
  f.elements.status.value = g?.status ?? "booked";
  f.elements.session.value = g?.session ?? session;
  f.elements.note.value = g?.note ?? "";
  $("#edit-title").textContent = g ? "The finer details." : "A seat at the table.";
  $("#form-error").textContent = "";
  $("#edit-dialog").showModal();
}
$("#edit-form").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.currentTarget,
    g = {
      id: editing ?? crypto.randomUUID(),
      name: f.elements.name.value,
      party: Number(f.elements.party.value),
      status: f.elements.status.value,
      session: f.elements.session.value,
      note: f.elements.note.value,
    };
  try {
    await save({
      ...data,
      guests: editing
        ? data.guests.map((row) => (row.id === editing ? g : row))
        : [...data.guests, g],
    });
    $("#edit-dialog").close();
  } catch (e) {
    $("#form-error").textContent = e.message;
  }
};
for (const s of sessions) {
  const b = document.createElement("button");
  b.dataset.session = s.id;
  b.setAttribute("aria-pressed", String(s.id === session));
  b.innerHTML = `<span>${s.day}</span>${s.title}`;
  b.onclick = () => {
    session = s.id;
    render();
  };
  $("#session-tabs").append(b);
  const option = document.createElement("option");
  option.value = s.id;
  option.textContent = s.title;
  $("#edit-form").elements.session.append(option);
}
$("#search").oninput = render;
$("#filter").onchange = render;
$("#add").onclick = () => openEditor();
$(".close").onclick = () => $("#edit-dialog").close();
$("#export").onclick = async () => {
  try {
    if (native) {
      const done = await window.venueStore.export();
      if (done) message("Guest list exported.");
    } else {
      const url = URL.createObjectURL(
          new Blob([JSON.stringify(validate(data), null, 2)], { type: "application/json" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "side-a-guests.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message("Guest list download prepared.");
    }
  } catch (e) {
    message(e.message);
  }
};
function confirmReplacement(next, text) {
  replace = next;
  $("#confirm-copy").textContent = text;
  $("#confirm-dialog").showModal();
}
$("#reset").onclick = () =>
  confirmReplacement(
    structuredClone(seed),
    "Restore the original fictional guest list? Your current list will be replaced. Export it first if you want to keep it.",
  );
$("#import").onclick = () => $("#import-file").click();
$("#import-file").onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    if (file.size > 500000) throw Error("Choose a JSON file under 500 KB.");
    const next = validate(JSON.parse(await file.text()));
    confirmReplacement(
      next,
      `Replace the current list with ${next.guests.length} imported bookings? Export your current list first if needed.`,
    );
  } catch (e) {
    message(e.message);
  }
};
$("#decline").onclick = () => {
  $("#confirm-dialog").close();
  replace = null;
};
$("#confirm").onclick = async () => {
  try {
    if (replace) await save(replace);
    replace = null;
    $("#confirm-dialog").close();
  } catch (e) {
    message(e.message);
    $("#confirm-dialog").close();
  }
};
load();
