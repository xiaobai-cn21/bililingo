import {
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
} from "./shared/settings.js";

const controls = {
  showPinyin: /** @type {HTMLInputElement} */ (
    document.querySelector("#showPinyin")
  ),
  pauseOnClick: /** @type {HTMLInputElement} */ (
    document.querySelector("#pauseOnClick")
  ),
  fontScale: /** @type {HTMLInputElement} */ (
    document.querySelector("#fontScale")
  ),
  opacity: /** @type {HTMLInputElement} */ (document.querySelector("#opacity")),
};
const saved = /** @type {HTMLElement} */ (document.querySelector("#saved"));
let savedTimer;
let saveQueue = Promise.resolve();

function render(settings) {
  for (const [key, control] of Object.entries(controls)) {
    if (control.type === "checkbox") control.checked = settings[key];
    else control.value = String(settings[key]);
  }
  document.querySelector("#fontScaleValue").textContent =
    `${Math.round(settings.fontScale * 100)}%`;
  document.querySelector("#opacityValue").textContent =
    `${Math.round(settings.opacity * 100)}%`;
}

async function save() {
  const patch = Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [
      key,
      control.type === "checkbox" ? control.checked : Number(control.value),
    ]),
  );
  const operation = saveQueue.then(() => writeSettings(patch));
  saveQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  try {
    const settings = await operation;
    render(settings);
    saved.textContent = "已保存 / Saved";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved.textContent = ""), 1500);
  } catch {
    saved.textContent = "保存失败，请重试 / Could not save";
  }
}

for (const control of Object.values(controls))
  control.addEventListener("input", save);
document.querySelector("#reset").addEventListener("click", async () => {
  const operation = saveQueue.then(() => writeSettings(DEFAULT_SETTINGS));
  saveQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  try {
    const settings = await operation;
    render(settings);
    saved.textContent = "已恢复默认 / Defaults restored";
  } catch {
    saved.textContent = "重置失败，请重试 / Could not reset";
  }
});

async function initialize() {
  render(await readSettings());
}

void initialize();
