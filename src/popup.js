import { readSettings, writeSettings } from "./shared/settings.js";

const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");

async function initialize() {
  const settings = await readSettings();
  enabled.checked = settings.enabled;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const state = await chrome.tabs.sendMessage(tab.id, { type: "bilingo:get-status" });
    const messages = {
      ready: "字幕已连接 / Captions connected",
      waiting: "正在等待原生字幕 / Waiting for native captions",
      "no-captions": "未检测到字幕，请在播放器中开启字幕 / No captions detected",
      "temporarily-unavailable": "字幕集成暂时不可用 / Caption integration temporarily unavailable",
      paused: "学习字幕已暂停 / Learning captions are paused",
    };
    status.textContent = state.eligible
      ? messages[state.captionState] ?? messages.waiting
      : "当前页面没有支持的播放器 / No supported player on this page";
  } catch {
    status.textContent = "请打开受支持的 Bilibili 视频页 / Open a supported Bilibili video page";
  }
}

enabled.addEventListener("change", async () => {
  try {
    await writeSettings({ enabled: enabled.checked });
    status.textContent = enabled.checked
      ? "学习字幕已启用，请开启播放器原生字幕 / Enabled; turn on Bilibili subtitles"
      : "学习字幕已暂停 / Learning captions are paused";
  } catch {
    enabled.checked = !enabled.checked;
    status.textContent = "保存失败，请重试 / Could not save; please retry";
  }
});

document.querySelector("#options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void initialize();
