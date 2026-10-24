export const $ = (s) => document.querySelector(s);
export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function shell(brand, content, tabs = []) {
  $("#app").innerHTML =
    `<header class="app-header"><span>${brand}</span><button id="reset" class="quiet">Reset demo</button></header><main id="main">${content}</main>${tabs.length ? `<nav class="tabs" aria-label="App sections">${tabs.map(([id, label, active]) => `<button data-tab="${id}" aria-pressed="${active}">${label}</button>`).join("")}</nav>` : ""}`;
}
let noticeTimer;
export function notice(text) {
  clearTimeout(noticeTimer);
  $("#notice").textContent = text;
  noticeTimer = setTimeout(() => {
    $("#notice").textContent = "";
  }, 4000);
}
export function editor(title, fields, save, remove) {
  const dialog = $("#editor");
  dialog.innerHTML = `<form id="edit-form"><header><h2 id="editor-title">${title}</h2><button type="button" id="cancel">Cancel</button></header>${fields}<p id="error" role="alert"></p><div class="form-actions">${remove ? '<button type="button" id="delete">Delete</button>' : ""}<button class="primary" type="submit">Save</button></div></form>`;
  $("#cancel").onclick = () => dialog.close();
  $("#edit-form").onsubmit = (event) => {
    event.preventDefault();
    try {
      save(new FormData(event.target));
      dialog.close();
      notice("Saved in this preview.");
    } catch (e) {
      $("#error").textContent = e.message;
    }
  };
  if (remove)
    $("#delete").onclick = () => {
      if (confirm("Delete this demo item? Reset demo will restore the examples.")) {
        remove();
        dialog.close();
        notice("Demo item deleted.");
      }
    };
  dialog.showModal();
}
export function field(label, name, value = "", type = "text", max = 140) {
  return `<label>${label}<input name="${name}" type="${type}" value="${escape(value)}" maxlength="${max}" required></label>`;
}
export function choices(label, name, values, value) {
  return `<label>${label}<select name="${name}">${Object.entries(values)
    .map(([k, v]) => `<option value="${k}" ${k === value ? "selected" : ""}>${v}</option>`)
    .join("")}</select></label>`;
}
export function check(label, name, value) {
  return `<label class="check"><input name="${name}" type="checkbox" ${value ? "checked" : ""}>${label}</label>`;
}
export function notes(value, max = 2000) {
  return `<label>Notes<textarea name="notes" rows="5" maxlength="${max}">${escape(value)}</textarea></label>`;
}
export function wireReset(reset) {
  $("#reset").onclick = () => {
    if (confirm("Restore the fictional examples and discard this preview’s edits?")) {
      reset();
      notice("Demo restored.");
    }
  };
}
