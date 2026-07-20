import { JSDOM } from "jsdom";

export function installDom(
  t,
  html = "<!doctype html><body></body>",
  url = "https://example.test/",
) {
  const dom = new JSDOM(html, { url });
  const names = [
    "document",
    "window",
    "location",
    "Event",
    "HTMLElement",
    "HTMLButtonElement",
    "HTMLInputElement",
    "HTMLSpanElement",
    "MutationObserver",
    "Node",
    "getComputedStyle",
  ];
  const originals = new Map(
    names.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  for (const name of names) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: dom.window[name],
    });
  }
  t.after(() => {
    dom.window.close();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  return dom;
}
