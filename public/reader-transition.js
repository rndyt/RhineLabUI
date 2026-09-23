/* Shared, parser-blocking setup: both documents opt in before first paint. */
(() => {
  const root = document.documentElement;
  const isReader = () => /^\/posts\/[^/]+\/$/.test(location.pathname);
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  function refreshMotion() {
    let p = {};
    try {
      p = JSON.parse(localStorage.getItem("rndyt-blog-settings") || "{}") || {};
    } catch {}
    const preset = p.motionPreset ?? p.motion?.preset;
    const enabled =
      preset === "system"
        ? !media.matches
        : typeof p.motion?.surfaceTransitions === "boolean"
          ? p.motion.surfaceTransitions
          : preset === "full"
            ? true
            : preset === "reduced" || p.reduced === true
              ? false
              : !media.matches;
    root.dataset.readerMotion = enabled ? "on" : "off";
    return enabled;
  }
  refreshMotion();
  media.addEventListener("change", refreshMotion);
  function pair(from, to) {
    if (!from || !to) return false;
    const a = new URL(from),
      b = new URL(to);
    if (a.origin !== location.origin || b.origin !== location.origin)
      return false;
    const matches = (archive, reader) =>
      archive.pathname === "/" &&
      archive.searchParams.get("post") &&
      reader.pathname === `/posts/${archive.searchParams.get("post")}/`;
    return matches(a, b) || matches(b, a);
  }
  function prepare(transition, from, to) {
    if (!transition) return;
    if (!refreshMotion() || !pair(from, to)) {
      transition.skipTransition();
      return;
    }
    const back = new URL(to).pathname === "/";
    root.dataset.readerDirection = back ? "back" : "forward";
    const title = document.querySelector(
      isReader() ? ".reader-column h1" : "#detail-content h2",
    );
    // A cold return may still be loading the 3D scene. Never animate its loading screen.
    if (!isReader() && (!title || !title.getClientRects().length)) {
      transition.skipTransition();
      return;
    }
    root.classList.add("reader-crossing");
    if (title) title.style.viewTransitionName = "article-title";
    const cleanup = () => {
      root.classList.remove("reader-crossing");
      if (title) title.style.viewTransitionName = "";
    };
    transition.finished.then(cleanup, cleanup);
  }
  addEventListener("pageswap", (event) => {
    prepare(event.viewTransition, location.href, event.activation?.entry?.url);
  });
  addEventListener("pagereveal", (event) => {
    prepare(
      event.viewTransition,
      window.navigation?.activation?.from?.url,
      location.href,
    );
  });
  addEventListener("pageshow", (event) => {
    refreshMotion();
    if (
      isReader() &&
      !event.persisted &&
      !root.classList.contains("reader-crossing")
    )
      root.classList.add("reader-enter");
  });
  addEventListener("pagehide", () => {
    if (isReader())
      try {
        sessionStorage.setItem(
          `reader-scroll:${location.pathname}`,
          String(scrollY),
        );
      } catch {}
  });
  document.addEventListener("DOMContentLoaded", () => {
    if (
      isReader() &&
      !location.hash &&
      pair(document.referrer, location.href)
    ) {
      try {
        scrollTo(
          0,
          Number(
            sessionStorage.getItem(`reader-scroll:${location.pathname}`),
          ) || 0,
        );
      } catch {}
    }
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute("download")
    )
      return;
    refreshMotion();
    if (pair(location.href, link.href) && !isReader()) {
      try {
        sessionStorage.setItem(
          "reader-return",
          JSON.stringify({ article: link.href, archive: location.href }),
        );
      } catch {}
      dispatchEvent(new Event("reader-open"));
    }
    if (link.matches(".reader-back")) {
      let previous;
      try {
        previous = JSON.parse(sessionStorage.getItem("reader-return"));
      } catch {}
      // Restore the actual 3D document (selection, tab and scroll) through BFCache.
      if (
        previous?.article === location.origin + location.pathname &&
        previous.archive === link.href &&
        document.referrer === previous.archive &&
        history.length > 1
      ) {
        event.preventDefault();
        history.back();
      }
    }
  });
})();
