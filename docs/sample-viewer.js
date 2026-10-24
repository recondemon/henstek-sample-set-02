(() => {
  if (document.getElementById("sample-preview")) return;
  const dialog = document.createElement("dialog");
  dialog.id = "sample-preview";
  dialog.className = "sample-preview";
  dialog.setAttribute("aria-labelledby", "preview-title");
  dialog.setAttribute("aria-describedby", "preview-note");
  dialog.innerHTML = `<div class="preview-top"><div><p id="preview-label"></p><h2 id="preview-title"></h2></div><button type="button" class="preview-close" aria-label="Close preview" autofocus>Close ×</button></div><div class="preview-stage"><div class="preview-device"><iframe title="Interactive sample" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals" referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div><div class="preview-bottom"><p id="preview-note"></p><div class="preview-actions"><a id="preview-open" target="_blank" rel="noopener noreferrer">Open separately ↗</a><a id="preview-start">Start with this ↗</a></div></div>`;
  document.body.append(dialog);
  const frame = dialog.querySelector("iframe");
  let opener, current, previousOverflow;
  const close = () => dialog.close();
  dialog.querySelector(".preview-close").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    frame.removeAttribute("src");
    document.documentElement.style.overflow = previousOverflow;
    opener?.focus({ preventScroll: true });
  });
  window.addEventListener("message", (event) => {
    if (
      dialog.open &&
      event.source === frame.contentWindow &&
      event.origin === current?.origin &&
      event.data?.type === "henstek-preview:close"
    )
      close();
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-preview]");
    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const url = new URL(link.href);
    if (url.origin !== location.origin && url.origin !== "https://recondemon.github.io") return;
    if (!["web", "mobile", "desktop"].includes(link.dataset.preview)) return;
    event.preventDefault();
    opener = link;
    current = url;
    const kind = link.dataset.preview;
    dialog.dataset.platform = kind;
    dialog.querySelector("#preview-label").textContent = link.dataset.label;
    dialog.querySelector("#preview-title").textContent = link.dataset.title;
    dialog.querySelector("#preview-note").textContent =
      kind === "mobile"
        ? "Browser adaptation of the iPhone app. Try the tabs and edit sample data. Reload to reset; native sharing and device features are not included."
        : kind === "desktop"
          ? "The desktop interface, running in your browser with local demo data. File actions use browser downloads. Use only sample information."
          : "A working website demo with fictional data. Explore the pages and forms; nothing is sent to a real business.";
    dialog.querySelector("#preview-open").href = url.href;
    dialog.querySelector("#preview-start").href = link.dataset.inquiry;
    frame.title = `${link.dataset.label} — ${link.dataset.title} interactive preview`;
    url.searchParams.set("embed", "1");
    frame.src = url.href;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
  });
})();
