// Optional icons are bundled from rtbf.ir; directory retrieval stays separate.
(function () {
  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const ICONS_PATH = "assets/images/service-icons/";
  let manifestRequest;

  function getManifest(signal) {
    if (!manifestRequest) {
      manifestRequest = fetch(extensionApi.runtime.getURL(ICONS_PATH + "index.json"), { signal })
        .then(response => {
          if (!response.ok) throw new Error("Icon list is unavailable");
          return response.json();
        });
    }
    return manifestRequest;
  }

  async function show(website) {
    const image = document.querySelector(".service-icon");
    if (!image) return;
    const controller = new AbortController();
    const cancel = () => {
      controller.abort();
      image.hidden = true;
      image.removeAttribute("src");
    };
    const timeout = setTimeout(cancel, 2000);
    window.addEventListener("pagehide", cancel, { once: true });
    try {
      const domain = new URL(/^https?:\/\//i.test(website) ? website : "https://" + website)
        .hostname.toLowerCase().replace(/\.$/, "");
      const manifest = await getManifest(controller.signal);
      const filename = manifest?.[domain];
      if (controller.signal.aborted || typeof filename !== "string" || !/^[a-z0-9][a-z0-9._-]*\.png$/.test(filename)) return;
      image.src = extensionApi.runtime.getURL(ICONS_PATH + filename);
      await image.decode();
      if (!controller.signal.aborted && image.isConnected) image.hidden = false;
    } catch {
      image.hidden = true;
      image.removeAttribute("src");
    } finally {
      clearTimeout(timeout);
      controller.abort();
      window.removeEventListener("pagehide", cancel);
    }
  }

  globalThis.RTBFServiceIcons = { show };
})();
