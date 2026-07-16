import { readSettings, writeSettings } from "./shared/settings.js";

const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");

async function initialize() {
  const settings = await readSettings();
  enabled.checked = settings.enabled;
}

enabled.addEventListener("change", async () => {
  await writeSettings({ enabled: enabled.checked });
  status.textContent = enabled.checked
    ? "Learning captions are enabled. Turn on Bilibili subtitles in the player."
    : "Learning captions are paused.";
});

document.querySelector("#options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void initialize();
