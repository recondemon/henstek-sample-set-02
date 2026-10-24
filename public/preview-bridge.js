// Escape closes the surrounding showcase, except while an app dialog is open.
if (window.parent !== window && new URLSearchParams(location.search).has("embed")) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
      const origin = document.referrer ? new URL(document.referrer).origin : "";
      if (origin) window.parent.postMessage({ type: "henstek-preview:close" }, origin);
    }
  });
}
