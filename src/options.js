import { DEFAULT_SETTINGS, readSettings, writeSettings } from "./shared/settings.js";

const controls = {
  showPinyin: document.querySelector("#showPinyin"),
  pauseOnClick: document.querySelector("#pauseOnClick"),
  fontScale: document.querySelector("#fontScale"),
  opacity: document.querySelector("#opacity"),
};
const saved = document.querySelector("#saved");
let savedTimer;

function render(settings) {
  for (const [key, control] of Object.entries(controls)) {
    if (control.type === "checkbox") control.checked = settings[key];
    else control.value = String(settings[key]);
  }
  document.querySelector("#fontScaleValue").textContent = `${Math.round(settings.fontScale * 100)}%`;
  document.querySelector("#opacityValue").textContent = `${Math.round(settings.opacity * 100)}%`;
}

async function save() {
  const patch = Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [
      key,
      control.type === "checkbox" ? control.checked : Number(control.value),
    ]),
  );
  const settings = await writeSettings(patch);
  render(settings);
  saved.textContent = "Saved";
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (saved.textContent = ""), 1500);
}

for (const control of Object.values(controls)) control.addEventListener("input", save);
document.querySelector("#reset").addEventListener("click", async () => {
  const settings = await writeSettings(DEFAULT_SETTINGS);
  render(settings);
  saved.textContent = "Defaults restored";
});

async function initialize() {
  render(await readSettings());
}

void initialize();
