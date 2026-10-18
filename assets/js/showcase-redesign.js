/* B.AI LAB — platform showcase interactions
   This module intentionally does not alter site.js research JSON or publication functions. */
(() => {
  "use strict";

  const sources = {
    overview: {
      title: "System Overview",
      domain: "Clinical & Ambulatory Assessment",
      description: "Integrated monitoring across clinical environments and daily life.",
      url: "assets/video_data/BAI_System_Overview_Loop.mp4"
    },
    hrv: {
      title: "HRV Monitoring", domain: "Clinical Research",
      description: "Cardiovascular dynamics and autonomic monitoring in clinical research.",
      url: "assets/video_data/bai_hrv_monitoring_loop.webm"
    },
    eeg: {
      title: "EEG Monitoring", domain: "Clinical Research",
      description: "Continuous neural activity in a contextualized monitoring environment.",
      url: "assets/video_data/bai_eeg_monitoring_loop.webm"
    },
    hemo: {
      title: "Hemodynamics & Perfusion", domain: "Clinical Research",
      description: "Hemodynamic responses, circulation and perfusion monitoring.",
      url: "assets/video_data/bai_hemodynamics_loop.webm"
    },
    contextual: {
      title: "Contextual Health Monitoring", domain: "Home-Based Assessment",
      description: "Nutrition, activity and sleep — physiological signals contextualized against personal baselines.",
      url: "assets/video_data/BAI_Contextual_Health_Monitoring_Loop.mp4"
    }
  };

  const main = document.getElementById("showcaseMainVideo");
  const screen = document.querySelector(".showcase-screen");
  const fallback = document.getElementById("showcaseVideoFallback");
  const title = document.getElementById("showcaseCurrentTitle");
  const domain = document.getElementById("showcaseCurrentDomain");
  const description = document.getElementById("showcaseCurrentDescription");
  const reset = document.getElementById("showcaseReset");
  const consoleNavigation = document.getElementById("showcaseConsoleNavigation");
  const consolePanel = document.getElementById("showcaseConsole");
  const motionButton = document.getElementById("showcaseMotion");
  const expandButton = document.getElementById("showcaseExpand");
  const viewer = document.getElementById("showcaseViewer");
  const viewerVideo = document.getElementById("showcaseViewerVideo");
  const viewerTitle = document.getElementById("showcaseViewerTitle");
  const viewerError = document.getElementById("showcaseViewerError");
  const viewerClose = document.getElementById("showcaseViewerClose");
  const fullscreenButton = document.getElementById("showcaseFullscreen");
  const viewerActions = document.querySelector(".showcase-viewer-actions");
  const controls = Array.from(document.querySelectorAll("[data-showcase-view]"));
  const previews = Array.from(document.querySelectorAll(".showcase-preview-video"));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewer = window.matchMedia("(max-width: 640px)");
  let selected = "overview";
  let viewerInvoker;
  let mainInView = false;
  let animationsPaused = motion.matches;
  const visiblePreviews = new Set();

  if (!main) return;

  const playSafely = video => {
    if (animationsPaused || document.hidden) return;
    video.play().catch(() => {});
  };

  function syncPlayback() {
    motionButton.textContent = animationsPaused ? "Play animations" : "Pause animations";
    motionButton.setAttribute("aria-pressed", String(animationsPaused));
    [main, ...previews].forEach(video => {
      const visible = video === main ? mainInView : visiblePreviews.has(video);
      if (visible && !viewer.open && !animationsPaused && !document.hidden) playSafely(video);
      else video.pause();
    });
  }

  // Posters keep all demonstrations visible with reduced motion or blocked autoplay.
  previews.forEach(video => {
    const key = video.closest("[data-showcase-view]")?.dataset.showcaseView;
    video.poster = `assets/images/video-posters/${key}.jpg`;
  });
  controls.forEach(control => control.setAttribute("aria-pressed", "false"));

  function setView(key, { scroll = true } = {}) {
    const view = sources[key];
    if (!view) return;
    selected = key;
    expandButton.setAttribute("aria-label", `View ${view.title} in larger viewer`);
    title.textContent = view.title;
    domain.textContent = view.domain;
    description.textContent = view.description;
    reset.hidden = key === "overview";
    controls.forEach(control => {
      const isSelected = control.dataset.showcaseView === key;
      control.classList.toggle("is-selected", isSelected);
      control.setAttribute("aria-pressed", String(isSelected));
    });
    fallback.hidden = true;

    // Avoid unnecessary reloads when the user selects the currently playing view.
    if (main.getAttribute("src") !== view.url) {
      main.pause();
      main.poster = `assets/images/video-posters/${key}.jpg`;
      main.src = view.url;
      main.load();
    }
    main.setAttribute("aria-label", `${view.title} animated demonstration video`);
    if (mainInView && !viewer.open) playSafely(main);

    // Give keyboard and mobile visitors immediate feedback on their selection.
    const rect = consolePanel.getBoundingClientRect();
    const navBottom = document.querySelector(".site-nav").getBoundingClientRect().bottom;
    if (scroll && (rect.top < navBottom || rect.bottom > window.innerHeight)) {
      consolePanel.scrollIntoView({ behavior: motion.matches ? "auto" : "smooth", block: "start" });
    }
  }

  function loadViewerView(key, inlineTime = 0) {
    const view = sources[key];
    viewerTitle.textContent = view.title;
    viewerVideo.setAttribute("aria-label", `${view.title} demonstration`);
    viewerVideo.classList.toggle("is-contextual", key === "contextual");
    viewerVideo.poster = `assets/images/video-posters/${key}.jpg`;
    viewerError.hidden = true;
    viewerVideo.src = view.url;
    viewerVideo.load();
    viewerVideo.onloadedmetadata = () => {
      if (viewer.open && inlineTime > 0 && inlineTime < viewerVideo.duration) viewerVideo.currentTime = inlineTime;
    };
  }

  function openViewer(invoker) {
    if (viewer.open) return;
    viewerInvoker = invoker;
    loadViewerView(selected, main.readyState >= 1 ? main.currentTime : 0);
    // Reuse the same return control in the active viewer; never duplicate it.
    viewerActions.prepend(reset);
    viewer.showModal();
    document.body.classList.add("viewer-open");
    syncPlayback();
    // Reduced motion remains paused until the visitor uses native controls.
    playSafely(viewerVideo);
    viewerClose.focus({ preventScroll: true });
  }

  viewerClose.addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    viewerVideo.pause();
    viewerVideo.onloadedmetadata = null;
    // Release the additional stream; the inline previews remain in place.
    viewerVideo.removeAttribute("src");
    viewerVideo.load();
    consoleNavigation.append(reset);
    document.body.classList.remove("viewer-open");
    syncPlayback();
    viewerInvoker?.focus({ preventScroll: true });
  });
  viewerVideo.addEventListener("error", () => {
    if (viewer.open) viewerError.hidden = false;
  });
  viewerVideo.addEventListener("loadeddata", () => { viewerError.hidden = true; });
  fullscreenButton.hidden = !viewerVideo.requestFullscreen && !viewerVideo.webkitEnterFullscreen;
  fullscreenButton.addEventListener("click", () => {
    if (viewerVideo.requestFullscreen) viewerVideo.requestFullscreen().catch(() => {});
    else if (viewerVideo.webkitEnterFullscreen) viewerVideo.webkitEnterFullscreen();
  });
  expandButton.setAttribute("aria-label", "View System Overview in larger viewer");
  expandButton.addEventListener("click", () => openViewer(expandButton));

  function updateViewerLabels() {
    controls.forEach(control => {
      const label = control.dataset.showcaseView === "contextual"
        ? document.getElementById("ambulatoryDomainTitle").textContent
        : sources[control.dataset.showcaseView].title;
      control.setAttribute("aria-label", mobileViewer.matches ? `Open ${label} in larger viewer` : `Play ${label} demonstration`);
      if (mobileViewer.matches) control.setAttribute("aria-haspopup", "dialog");
      else control.removeAttribute("aria-haspopup");
    });
    const action = document.querySelector(".showcase-ambulatory-action");
    if (action) action.textContent = mobileViewer.matches ? "View larger ↗" : "Explore assessment ↗";
  }
  updateViewerLabels();
  mobileViewer.addEventListener("change", updateViewerLabels);

  main.addEventListener("error", () => {
    if (fallback) fallback.hidden = false;
  });
  main.querySelector("source")?.addEventListener("error", () => {
    if (fallback) fallback.hidden = false;
  });
  main.addEventListener("loadeddata", () => {
    if (fallback) fallback.hidden = true;
  });
  controls.forEach(control => control.addEventListener("click", () => {
    setView(control.dataset.showcaseView, { scroll: !mobileViewer.matches });
    if (mobileViewer.matches) openViewer(control);
  }));
  reset?.addEventListener("click", () => {
    const inViewer = viewer.open;
    setView("overview", { scroll: !inViewer });
    if (inViewer) {
      loadViewerView("overview");
      playSafely(viewerVideo);
      viewerClose.focus({ preventScroll: true });
    } else {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  });
  motionButton.addEventListener("click", () => {
    animationsPaused = !animationsPaused;
    syncPlayback();
  });

  // Preview clips run only while on screen; the main clip also pauses offscreen.
  if ("IntersectionObserver" in window) {
    const previewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) visiblePreviews.add(video);
        else visiblePreviews.delete(video);
      });
      syncPlayback();
    }, { threshold: .15 });
    previews.forEach(video => previewObserver.observe(video));

    const mainObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      mainInView = Boolean(entry?.isIntersecting);
      syncPlayback();
    }, { threshold: .06 });
    mainObserver.observe(screen);
  } else {
    mainInView = true;
    previews.forEach(video => visiblePreviews.add(video));
    syncPlayback();
  }

  document.addEventListener("visibilitychange", () => {
    syncPlayback();
    if (document.hidden) viewerVideo.pause();
  });

  motion.addEventListener?.("change", () => {
    animationsPaused = motion.matches;
    if (animationsPaused) viewerVideo.pause();
    syncPlayback();
  });

  syncPlayback();

  // Extend the retained navigation behavior for keyboard and viewport changes.
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const closeNavigation = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-label", "Open navigation");
  };
  navToggle.addEventListener("click", () => {
    navToggle.setAttribute("aria-label", navToggle.getAttribute("aria-expanded") === "true" ? "Close navigation" : "Open navigation");
  });
  navLinks.addEventListener("click", event => {
    if (event.target.closest("a")) closeNavigation();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      closeNavigation();
      navToggle.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", event => {
    if (event.matches) closeNavigation();
  });
})();
