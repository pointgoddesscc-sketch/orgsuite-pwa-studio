const form = document.getElementById("audit-form");
const urlInput = document.getElementById("pwa-url");
const results = document.getElementById("results");
const installBtn = document.getElementById("install-btn");

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function row(label, status, note) {
  const klass = status === "pass" ? "ok" : status === "warn" ? "warn" : "bad";
  const text = status === "pass" ? "Pass" : status === "warn" ? "Check" : "Fail";
  return `<div class="check"><span>${label}<br><small class="muted">${note}</small></span><span class="badge ${klass}">${text}</span></div>`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = urlInput.value.trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    results.innerHTML = row("URL", "fail", "Enter a valid https URL.");
    return;
  }

  const https = parsed.protocol === "https:";
  const mixedGuess = parsed.protocol !== "https:";
  let manifest = "warn";
  let sw = "warn";
  let reachable = "warn";
  let note = "Browser CORS limits a full remote audit. Use PWABuilder.com for store packaging.";

  try {
    const probe = await fetch(parsed.origin + "/manifest.webmanifest", { mode: "no-cors" });
    reachable = "pass";
    if (probe && probe.type) manifest = "warn";
  } catch {
    reachable = "warn";
  }

  results.innerHTML = [
    row("HTTPS", https && !mixedGuess ? "pass" : "fail", https ? "Origin uses TLS." : "PWA packaging requires HTTPS."),
    row("Reachable origin", reachable, note),
    row("Web app manifest", manifest, "Confirm name, short_name, start_url, icons, display."),
    row("Service worker", sw, "Confirm a worker with cache handlers."),
    row("Store packages", "warn", "Windows / iOS / Android packages still require developer accounts.")
  ].join("");
});
