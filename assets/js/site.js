/* ================================================================
   B.AI LAB — SITE INTERACTIONS / DATA
   ---------------------------------------------------------------
   Configure contact details and video mappings here.
   Publications / editorial / peer review are loaded from JSON.
================================================================ */

const SITE_CONFIG = {
  // Add one email here before deployment, e.g. "name@university.de".
  email: "",

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
    video: "assets/video_data/bai_system_overview_loop.webm",
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
  return authors
    .map(author => {
      const safe = escapeHtml(author);
      return /Gellisch/i.test(author) ? `<strong>${safe}</strong>` : safe;
    })
    .join(", ");
}

function roleLabel(role = "") {
  const map = {
    first_author: "First author",
    shared_first_author: "Shared first author",
    shared_senior_author: "Shared senior author",
    senior_author: "Senior author",
    sole_author: "Sole author",
    co_author: "Co-author"
  };
  return map[role] || role.replaceAll("_", " ");
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

let publicationData = [];
let showingAllPublications = false;

function sortPublications(data) {
  return [...data].sort((a, b) => {
    if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  });
}

function publicationMarkup(pub) {
  const venue = pub.journal || pub.book_title || "Work in review";
  const detail = [venue, pub.volume ? `Vol. ${pub.volume}` : "", pub.article || pub.pages || ""]
    .filter(Boolean)
    .join(" · ");

  const link = pub.doi
    ? `https://doi.org/${encodeURIComponent(pub.doi)}`
    : pub.url || "";

  return `
    <article class="publication-item">
      <div class="publication-year">${escapeHtml(pub.year || "")}</div>
      <div>
        <h3 class="publication-title">${escapeHtml(pub.title || "")}</h3>
        <p class="publication-authors">${formatAuthors(pub.authors || [])}</p>
        <p class="publication-meta">
          <span>${escapeHtml(detail)}</span>
          ${pub.authorship_role ? `<span class="publication-role">${escapeHtml(roleLabel(pub.authorship_role))}</span>` : ""}
          ${pub.status && pub.status !== "published" ? `<span>${escapeHtml(pub.status.replaceAll("_", " "))}</span>` : ""}
        </p>
      </div>
      ${link ? `<a class="publication-link" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">View ↗</a>` : ""}
    </article>
  `;
}

function renderPublications() {
  const container = $("#publicationList");
  const toggle = $("#togglePublications");
  if (!container) return;

  const sorted = sortPublications(publicationData);
  const featured = sorted.filter(pub => pub.featured);
  const initial = featured.length ? featured.slice(0, 6) : sorted.slice(0, 6);
  const visible = showingAllPublications ? sorted : initial;

  container.innerHTML = visible.map(publicationMarkup).join("");

  if (toggle && sorted.length > initial.length) {
    toggle.hidden = false;
    toggle.textContent = showingAllPublications ? "Show selected publications" : `Show all publications (${sorted.length})`;
  }
}

$("#togglePublications")?.addEventListener("click", () => {
  showingAllPublications = !showingAllPublications;
  renderPublications();
});


/* ================================================================
   ACADEMIC SERVICE
================================================================ */

function renderEditorial(data) {
  const container = $("#editorialRoles");
  if (!container) return;

  const roles = data?.editorial_roles || [];
  container.innerHTML = roles.map(item => `
    <article class="editorial-card">
      <h3>${escapeHtml(item.journal)}</h3>
      <p>${escapeHtml(item.role)} · ${escapeHtml(item.publisher || "")}${item.section ? ` · ${escapeHtml(item.section)}` : ""}</p>
      ${item.research_topic ? `<p class="topic">${escapeHtml(item.research_topic)}</p>` : ""}
    </article>
  `).join("");
}

function renderPeerReview(data) {
  const journalsContainer = $("#reviewJournals");
  const doctoralContainer = $("#doctoralReview");
  if (!journalsContainer) return;

  const journals = data?.journal_reviewing || [];
  journalsContainer.innerHTML = journals.map(item => `
    <span class="journal-pill" title="${escapeHtml(item.publisher || "")}">${escapeHtml(item.journal)}</span>
  `).join("");

  const doctoral = data?.doctoral_reviewing?.[0];
  if (doctoral && doctoralContainer) {
    doctoralContainer.innerHTML = `
      <article class="doctoral-card">
        <strong>${escapeHtml(doctoral.role)}</strong>
        <p>${escapeHtml((doctoral.institutions || []).join(" · "))}</p>
      </article>
    `;
  }
}


/* ================================================================
   RESEARCH METRICS / JSON LOADING
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

    publicationData = publications;
    renderPublications();
    renderEditorial(editorial);
    renderPeerReview(peer);

    const publishedCount = publications.filter(pub => pub.status === "published").length;
    const editorialCount = editorial?.editorial_roles?.length || 0;
    const reviewCount = peer?.journal_reviewing?.length || 0;

    $("#metricPublications").textContent = publishedCount;
    $("#metricEditorial").textContent = editorialCount;
    $("#metricReviewing").textContent = reviewCount;
  } catch (error) {
    console.error(error);

    const publicationList = $("#publicationList");
    if (publicationList) publicationList.innerHTML = `<p class="data-error">Publication data could not be loaded.</p>`;

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
