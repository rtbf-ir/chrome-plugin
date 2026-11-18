import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const source = readFileSync(new URL("../service-icons.js", import.meta.url), "utf8");
const manifest = { "aparat.com": "aparat.png" };

function popup({ fetcher, decodeError = false, namespace = "chrome" } = {}) {
  const requests = [], timers = new Map(), listeners = new Map();
  const base = namespace === "chrome" ? "chrome-extension://test/" : "moz-extension://test/";
  const image = {
    hidden: true, isConnected: true, src: "",
    async decode() { if (decodeError) throw new Error("Invalid PNG"); },
    removeAttribute(name) { if (name === "src") this.src = ""; },
  };
  const api = {
    runtime: { getURL: pathname => base + pathname },
    storage: { local: { get() { throw new Error("Icon loader must not read the directory cache"); } } },
  };
  const context = vm.createContext({
    [namespace]: api,
    document: { querySelector() { return image; } },
    window: {
      addEventListener(name, listener) { listeners.set(name, listener); },
      removeEventListener(name) { listeners.delete(name); },
    },
    URL, AbortController,
    setTimeout(callback, delay) { timers.set(callback, delay); return callback; },
    clearTimeout(callback) { timers.delete(callback); },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return fetcher ? fetcher(url, options) : Response.json(manifest);
    },
  });
  vm.runInContext(source, context);
  return { show: context.RTBFServiceIcons.show, image, requests, timers, listeners, base };
}

for (const namespace of ["chrome", "browser"]) {
  test(`${namespace}: loads only the bundled icon matching the existing service record`, async () => {
    const app = popup({ namespace });
    await app.show("APARAT.COM/");
    assert.equal(app.image.hidden, false);
    assert.deepEqual(app.requests.map(request => request.url), [app.base + "assets/images/service-icons/index.json"]);
    assert.equal(app.image.src, app.base + "assets/images/service-icons/aparat.png");
    assert.equal(app.timers.size, 0);
    assert.equal(app.listeners.size, 0);
  });
}

test("reuses the local manifest within the popup without reading or writing the data cache", async () => {
  const app = popup();
  await app.show("aparat.com");
  await app.show("aparat.com");
  assert.equal(app.requests.length, 1);
  assert.equal(app.image.hidden, false);
});

test("a stalled local request is aborted at the two-second deadline without throwing", async () => {
  let requestedSignal;
  const app = popup({ fetcher: (_url, { signal }) => new Promise((_resolve, reject) => {
    requestedSignal = signal;
    signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
  }) });
  const loading = app.show("aparat.com");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.requests.length, 1);
  assert.deepEqual([...app.timers.values()], [2000]);
  for (const callback of [...app.timers.keys()]) callback();
  await loading;
  assert.equal(requestedSignal.aborted, true);
  assert.equal(app.image.hidden, true);
  assert.equal(app.timers.size, 0);
});

test("a missing icon or unsafe filename never requests a website favicon", async () => {
  for (const data of [{}, { "aparat.com": "https://aparat.com/favicon.ico" }, { "aparat.com": "../favicon.png" }]) {
    const app = popup({ fetcher: async () => Response.json(data) });
    await app.show("aparat.com");
    assert.equal(app.requests.length, 1);
    assert(app.requests.every(request => request.url.startsWith(app.base)));
    assert.equal(app.image.src, "");
    assert.equal(app.image.hidden, true);
  }
});

test("unavailable local files and corrupt images leave the optional icon hidden", async () => {
  for (const options of [
    { decodeError: true },
    { fetcher: async () => new Response("missing", { status: 404 }) },
    { fetcher: async () => Response.json({}) },
  ]) {
    const app = popup(options);
    await app.show("aparat.com");
    assert.equal(app.image.hidden, true);
    assert.equal(app.timers.size, 0);
    assert.equal(app.listeners.size, 0);
  }
});

test("closing the popup cancels a pending optional local icon read", async () => {
  const app = popup({ fetcher: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Closed")), { once: true });
  }) });
  const loading = app.show("aparat.com");
  await new Promise(resolve => setImmediate(resolve));
  app.listeners.get("pagehide")();
  await loading;
  assert.equal(app.image.hidden, true);
  assert.equal(app.listeners.size, 0);
});
