/* ================================================================
   B.AI LAB — SITE INTERACTIONS / DATA
   ---------------------------------------------------------------
   Configure contact details and video mappings here.
   Publications / editorial / peer review are loaded from JSON.
================================================================ */

const SITE_CONFIG = {
  // Add one email here before deployment, e.g. "name@university.de".
  email: "morris.gellisch@ruhr-uni-bochum.de",

  data: {
    publications: "assets/research/publications.json",
    editorial: "assets/research/editorial-roles.json",
    peerReview: "assets/research/peer-review.json"
  }
};


/* ================================================================
   PLATFORM VIDEO CONFIG
   Change labels/copy/paths here without touching HTML.
================================================================ */

const PLATFORM_VIEWS = {
  overview: {
    mode: "System Overview",
    title: "Multimodal physiological monitoring",
    description: "The overview connects cardiovascular, neural and hemodynamic monitoring within a single research workspace.",
    video: "assets/video_data/BAI_System_Overview_Loop.mp4",
    corner: "Click a physiological system to inspect the stream."
  },
  hrv: {
    mode: "Cardiovascular System",
    title: "HRV and cardiovascular dynamics",
    description: "A live cardiovascular layer linking beat-to-beat dynamics, HRV features and event timing within the same contextual timeline.",
    video: "assets/video_data/bai_hrv_monitoring_loop.webm",
    corner: "Cardiovascular · HRV"
  },
  eeg: {
    mode: "Central Nervous System",
    title: "EEG and neural activity",
    description: "Continuous EEG monitoring with channel-level dynamics and physiological context prepared for downstream analysis.",
    video: "assets/video_data/bai_eeg_monitoring_loop.webm",
    corner: "Central Nervous System · EEG"
  },
  hemo: {
    mode: "Hemodynamics & Perfusion",
    title: "Hemodynamic state and perfusion",
    description: "Hemodynamic and perfusion streams aligned with interventions and physiological context on a shared research timeline.",
    video: "assets/video_data/bai_hemodynamics_loop.webm",
    corner: "Hemodynamics & Perfusion"
  }
};


/* ================================================================
   GENERIC HELPERS
================================================================ */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAuthors(authors = []) {
  const names = authors.map(author => {
    const safe = escapeHtml(author);
    return /^Gellisch, M\.$/.test(author) ? `<strong>${safe}</strong>` : safe;
  });
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")}, &amp; ${names.at(-1)}`;
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

// Unreleased journal artwork is restricted to loopback design previews.
const IS_LOCAL_DESIGN_PREVIEW = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(window.location.hostname);

function availableJournalVisual(item) {
  const visual = item.journal_visual;
  const valid = visual && /^assets\/images\/journals\/[a-z0-9-]+\.(webp|png|jpg|svg)$/.test(visual.src);
  return valid && (!visual.preview_only || IS_LOCAL_DESIGN_PREVIEW) ? visual : null;
}

function journalVisual(item, { fallbackName = true } = {}) {
  const visual = availableJournalVisual(item);
  const fallback = fallbackName ? `<span class="journal-name-fallback"${visual ? " hidden" : ""}>${escapeHtml(item.journal)}</span>` : "";
  if (visual) return `<img data-journal-image src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt || `${item.journal} journal branding`)}" loading="lazy" decoding="async" />${fallback}`;
  return fallback;
}

function serviceVisual(item, className) {
  if (!availableJournalVisual(item)) return "";
  return `<div class="journal-visual ${className}" data-service-visual>${journalVisual(item, { fallbackName: false })}</div>`;
}

function serviceVisualClasses(item) {
  const visual = availableJournalVisual(item);
  return visual ? ` has-journal-visual${visual.kind === "cover" ? " has-journal-cover" : ""}` : "";
}

function attachJournalImageFallbacks(container) {
  container.querySelectorAll("img[data-journal-image]").forEach(img => {
    const showFallback = () => {
      img.hidden = true;
      const fallback = img.nextElementSibling;
      if (fallback?.classList.contains("journal-name-fallback")) fallback.hidden = false;
      const serviceWrapper = img.closest("[data-service-visual]");
      if (serviceWrapper) {
        serviceWrapper.hidden = true;
        serviceWrapper.closest(".editorial-card, .review-journal-card")?.classList.remove("has-journal-visual", "has-journal-cover");
      }
    };
    img.addEventListener("error", showFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) showFallback();
  });
}

/* ================================================================
   NAVIGATION
================================================================ */

const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!open));
  navLinks?.classList.toggle("is-open", !open);
  document.body.classList.toggle("menu-open", !open);
});

$$("#navLinks a").forEach(link => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    navLinks?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  });
});


/* ================================================================
   INTERACTIVE PLATFORM VIDEOS
================================================================ */

const platformStage = $("#platformStage");
const platformVideo = $("#platformVideo");
const platformMode = $("#platformMode");
const platformTitle = $("#platformTitle");
const platformDescription = $("#platformDescription");
const platformCornerCopy = $("#platformCornerCopy");
const overviewHotspots = $("#overviewHotspots");
const platformBack = $("#platformBack");
const platformTabs = $$("[data-platform-view]");

let currentPlatformView = "overview";

function updatePlatformTabs(key) {
  $$(".platform-tab").forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.platformView === key);
  });
}

async function switchPlatformView(key) {
  const view = PLATFORM_VIEWS[key];
  if (!view || !platformVideo || key === currentPlatformView) return;

  currentPlatformView = key;
  platformStage?.classList.add("is-switching");

  platformMode.textContent = view.mode;
  platformTitle.textContent = view.title;
  platformDescription.textContent = view.description;
  platformCornerCopy.textContent = view.corner;

  overviewHotspots.hidden = key !== "overview";
  platformBack.hidden = key === "overview";
  updatePlatformTabs(key);

  platformVideo.pause();
  platformVideo.src = view.video;
  platformVideo.load();

  const finish = () => {
    platformStage?.classList.remove("is-switching");
    platformVideo.play().catch(() => {});
  };

  platformVideo.addEventListener("canplay", finish, { once: true });
  window.setTimeout(finish, 850);
}

platformTabs.forEach(control => {
  control.addEventListener("click", () => switchPlatformView(control.dataset.platformView));
});

platformBack?.addEventListener("click", () => switchPlatformView("overview"));

// Attempt autoplay on first user interaction if the browser delayed it.
document.addEventListener("pointerdown", () => {
  platformVideo?.play().catch(() => {});
}, { once: true });


/* ================================================================
   PUBLICATIONS
================================================================ */

const SELECTED_PUBLICATION_IDS = Object.freeze([
  "gellisch-schaefer-2026-peer-led-examination",
  "gellisch-et-al-2024-neurobiological-stress-markers-review",
  "gellisch-burr-2025-hrv-llm"
]);

function publicationMarkup(pub) {
  const link = externalUrl(`https://doi.org/${pub.doi}`);
  const detail = [pub.journal, pub.volume, pub.article || pub.pages].filter(Boolean).join(", ");
  const published = pub.publication_date && /^\d{4}-\d{2}-\d{2}$/.test(pub.publication_date)
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${pub.publication_date}T00:00:00Z`))
    : "";

  return `
    <article class="publication-item" data-publication-id="${escapeHtml(pub.id)}">
      <a class="publication-visual journal-visual" data-journal-kind="${pub.journal_visual?.kind === "cover" ? "cover" : "logo"}" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${escapeHtml(pub.title)} — ${escapeHtml(pub.journal)} (opens in new tab)">
        ${journalVisual(pub)}
      </a>
      <div class="publication-citation">
        <p class="publication-authors">${formatAuthors(pub.authors)} (${escapeHtml(pub.year)}).</p>
        <h3 class="publication-title"><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pub.title)}</a></h3>
        <p class="publication-meta">${escapeHtml(detail)}.</p>
        ${published ? `<p class="publication-date">Published <time datetime="${escapeHtml(pub.publication_date)}">${escapeHtml(published)}</time></p>` : ""}
        <a class="publication-doi" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">DOI: ${escapeHtml(pub.doi)} <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
}

function renderPublications(publications) {
  const container = $("#publicationList");
  if (!container) return;
  const byId = new Map(publications.map(pub => [pub.id, pub]));
  const selected = SELECTED_PUBLICATION_IDS.map(id => {
    if (!byId.has(id)) throw new Error(`Selected publication is missing: ${id}`);
    return byId.get(id);
  });
  container.innerHTML = selected.map(publicationMarkup).join("");
  attachJournalImageFallbacks(container);
}


/* ================================================================
   ACADEMIC SERVICE
================================================================ */

function renderEditorial(data) {
  const topicContainer = $("#researchTopic");
  const container = $("#editorialRoles");
  const topic = data?.research_topic_leadership;
  if (topicContainer && topic) {
    topicContainer.innerHTML = `
      <a class="research-topic-card" href="${escapeHtml(externalUrl(topic.url))}" target="_blank" rel="noopener noreferrer">
        <div class="topic-visual journal-visual">${journalVisual(topic)}</div>
        <div class="research-topic-copy">
          <p class="topic-role">${escapeHtml(topic.role)}</p>
          <h3>${escapeHtml(topic.title)}</h3>
          <p class="topic-journal">${escapeHtml(topic.journal)}</p>
          <span class="topic-link">Explore the Research Topic <span aria-hidden="true">↗</span></span>
        </div>
      </a>`;
    attachJournalImageFallbacks(topicContainer);
  }
  if (!container) return;
  // The verified Topic Editor appointment is represented once, above.
  // A separate Digital Health role can be restored after independent verification.
  const roles = (data?.editorial_roles || []).filter(item => !(item.display_as_topic_leadership && topic && item.research_topic_id === topic.id));
  container.innerHTML = roles.map(item => `
    <a class="editorial-card${serviceVisualClasses(item)}" href="${escapeHtml(externalUrl(item.url))}" target="_blank" rel="noopener noreferrer">
      ${serviceVisual(item, "editorial-journal-visual")}
      <div class="editorial-journal-copy">
        <h4>${escapeHtml(item.journal)}</h4>
        <p>${escapeHtml(item.role)}${item.section ? ` · ${escapeHtml(item.section)}` : ""}</p>
      </div>
      <span aria-hidden="true">↗</span>
    </a>`).join("");
  attachJournalImageFallbacks(container);
}

function renderPeerReview(data) {
  const journalsContainer = $("#reviewJournals");
  const doctoralContainer = $("#doctoralReview");
  if (journalsContainer) {
    journalsContainer.innerHTML = (data?.journal_reviewing || []).map(item => `
      <a class="review-journal-card${serviceVisualClasses(item)}" href="${escapeHtml(externalUrl(item.url))}" target="_blank" rel="noopener noreferrer" aria-label="Morris Gellisch — Peer Reviewer for ${escapeHtml(item.journal)}">
        ${serviceVisual(item, "review-journal-visual")}
        <h4>${escapeHtml(item.journal)}</h4>
        <span class="journal-arrow" aria-hidden="true">↗</span>
      </a>`).join("");
    attachJournalImageFallbacks(journalsContainer);
  }
  if (doctoralContainer) {
    doctoralContainer.innerHTML = (data?.doctoral_reviewing || []).map(item => `
      <article class="doctoral-card">
        <h3>${escapeHtml(item.role)}</h3>
        <p class="doctoral-institutions">${escapeHtml((item.institutions || []).join(" · "))}</p>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      </article>`).join("");
  }
}


/* ================================================================
   RESEARCH JSON LOADING
================================================================ */

async function loadResearchData() {
  try {
    const [pubResponse, editorialResponse, peerResponse] = await Promise.all([
      fetch(SITE_CONFIG.data.publications),
      fetch(SITE_CONFIG.data.editorial),
      fetch(SITE_CONFIG.data.peerReview)
    ]);

    if (!pubResponse.ok || !editorialResponse.ok || !peerResponse.ok) {
      throw new Error("One or more research data files could not be loaded.");
    }

    const [publications, editorial, peer] = await Promise.all([
      pubResponse.json(),
      editorialResponse.json(),
      peerResponse.json()
    ]);

    renderPublications(publications);
    renderEditorial(editorial);
    renderPeerReview(peer);
  } catch (error) {
    console.error(error);

    const publicationList = $("#publicationList");
    if (publicationList) publicationList.innerHTML = `<p class="data-error">Publication data could not be loaded.</p>`;

    const researchTopic = $("#researchTopic");
    if (researchTopic) researchTopic.innerHTML = "";

    const editorialRoles = $("#editorialRoles");
    if (editorialRoles) editorialRoles.innerHTML = `<p class="data-error">Editorial data could not be loaded.</p>`;

    const reviewJournals = $("#reviewJournals");
    if (reviewJournals) reviewJournals.innerHTML = `<p class="data-error">Peer-review data could not be loaded.</p>`;
  }
}


/* ================================================================
   CONTACT CONFIG
================================================================ */

function configureContact() {
  const emailLink = $("#emailLink");
  const contactNote = $("#contactNote");

  if (SITE_CONFIG.email && emailLink) {
    emailLink.href = `mailto:${SITE_CONFIG.email}`;
    emailLink.hidden = false;
    if (contactNote) contactNote.hidden = true;
  }
}


/* ================================================================
   INIT
================================================================ */

$("#currentYear").textContent = new Date().getFullYear();
configureContact();
loadResearchData();
