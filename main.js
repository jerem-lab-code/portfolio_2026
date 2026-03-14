import "./style.css";
import "./project-pages.css";
import { initCategories } from "./categories.js";
import { initProjectPages } from "./projectPages.js";
import { initScrollLock } from "./scrollLock.js";
import { initImageTrail } from "./imageTrail.js";

initScrollLock({ allowSelector: ".gallery-panel" });
const galleryPanel = document.getElementById("gallery-panel");
const projectPages = initProjectPages({ galleryPanel });
const infoButton = document.getElementById("info-button");
const pageBody = document.body;
let lastScrollPosition = 0;
let isInfoOpen = false;
let infoOpeningTimeoutId = null;
let infoOpenFrameId = null;
const infoMutedVideoButtons = new Set();
const infoMutedNativeVideos = new Map();
const INFO_OPENING_DURATION_MS = 760;

const infoView = createInfoView();
setInfoButtonState();

// Initialize image trail effect
const imageTrail = initImageTrail();
let isTrailRunning = false;

function shouldRunTrail() {
  return !(
    pageBody.classList.contains("is-gallery-active") ||
    pageBody.classList.contains("is-categories") ||
    pageBody.classList.contains("is-project-view") ||
    pageBody.classList.contains("is-info-open") ||
    pageBody.classList.contains("is-info-opening")
  );
}

function syncTrailState() {
  if (document.hidden) {
    if (isTrailRunning) {
      imageTrail.stop();
      isTrailRunning = false;
    }
    return;
  }
  if (shouldRunTrail()) {
    if (!isTrailRunning) {
      imageTrail.start();
      isTrailRunning = true;
    }
    return;
  }
  if (isTrailRunning) {
    imageTrail.stop();
    isTrailRunning = false;
  }
}

function createInfoView() {
  const view = document.createElement("section");
  view.className = "info-view";
  view.id = "info-view";
  view.setAttribute("aria-hidden", "true");
  view.setAttribute("aria-label", "Information");

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "pill-button info-view-back-button";
  backButton.textContent = "Back";
  backButton.setAttribute("aria-label", "Close information page");
  backButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeInfo();
  });

  const content = document.createElement("div");
  content.className = "info-view-content";

  const name = document.createElement("p");
  name.className = "info-view-name";
  // name.textContent = "Jeremie Kursner";

  const text = document.createElement("p");
  text.className = "info-view-text";
  text.textContent =
    "Jérémie Kursner is a Swiss media interactive designer based in Amsterdam (NL), graduate of ECAL / University of Art and Design Lausanne (CH).\n\nHe bridges design and technology through 2D/3D animation, creative coding, visual identity, and prototyping. By developing custom tools, motion, design identity and interactive installations he transforms ideas into engaging, tangible experiences. His approach combines narrative thinking with hands-on experimentation, moving seamlessly from concept to execution.\n\nHis work has been presented at Expo 2025 Osaka (JP), Milan Design Week (IT), and Le Cube Garges (FR).";

  const tabs = document.createElement("div");
  tabs.className = "info-view-tabs";

  const infoTabButton = document.createElement("button");
  infoTabButton.type = "button";
  infoTabButton.className = "category-button info-view-tab is-active";
  infoTabButton.textContent = "Info";
  infoTabButton.setAttribute("aria-pressed", "true");

  const skillsTabButton = document.createElement("button");
  skillsTabButton.type = "button";
  skillsTabButton.className = "category-button info-view-tab";
  skillsTabButton.textContent = "Skills";
  skillsTabButton.setAttribute("aria-pressed", "false");

  tabs.append(infoTabButton, skillsTabButton);

  const panels = document.createElement("div");
  panels.className = "info-view-panels";
  panels.dataset.active = "info";

  const infoPanel = document.createElement("div");
  infoPanel.className = "info-view-panel";
  infoPanel.dataset.panel = "info";
  infoPanel.append(text);

  const skillsPanel = document.createElement("div");
  skillsPanel.className = "info-view-panel";
  skillsPanel.dataset.panel = "skills";

  const skillsPills = document.createElement("div");
  skillsPills.className = "info-view-skills-pills";

  const skills = [
    "Figma",
    "Photoshop",
    "Illustrator",
    "InDesign",
    "After Effects",
    "Blender",
    "Javascript",
    "HTML/CSS",
    "Figma Make",
    "Antigravity",
    "Codex",
    "Nanao Banana",
    "Midjourney",
  ];

  skills.forEach((item) => {
    const pill = document.createElement("span");
    pill.className = "info-view-skill-pill";
    pill.textContent = item;
    skillsPills.append(pill);
  });

  skillsPanel.append(skillsPills);
  panels.append(infoPanel, skillsPanel);

  const setActiveTab = (tab) => {
    const isInfo = tab === "info";
    panels.dataset.active = isInfo ? "info" : "skills";
    infoTabButton.classList.toggle("is-active", isInfo);
    skillsTabButton.classList.toggle("is-active", !isInfo);
    infoTabButton.setAttribute("aria-pressed", String(isInfo));
    skillsTabButton.setAttribute("aria-pressed", String(!isInfo));
    syncPanelsHeight();
  };

  infoTabButton.addEventListener("click", () => setActiveTab("info"));
  skillsTabButton.addEventListener("click", () => setActiveTab("skills"));

  const links = document.createElement("div");
  links.className = "info-view-links";

  const mailLink = document.createElement("a");
  mailLink.className = "pill-button info-view-link";
  mailLink.href = "mailto:jeremiekursner@gmail.com";
  mailLink.textContent = "e-mail";
  mailLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  const instagramLink = document.createElement("a");
  instagramLink.className = "pill-button info-view-link";
  instagramLink.href = "https://www.instagram.com/jeremiekursner/?hl=fr";
  instagramLink.target = "_blank";
  instagramLink.rel = "noreferrer noopener";
  instagramLink.textContent = "Instagram";
  instagramLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });


  links.append(instagramLink, mailLink, backButton);
  content.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  const syncPanelsHeight = () => {
    const target = infoPanel.scrollHeight;
    if (target > 0) {
      panels.style.height = `${Math.round(target)}px`;
      panels.style.maxHeight = `${Math.round(target)}px`;
    }
  };

  const handleResize = () => {
    if (infoView.getAttribute("aria-hidden") === "false") {
      syncPanelsHeight();
    }
  };

  window.addEventListener("resize", handleResize);
  requestAnimationFrame(syncPanelsHeight);

  content.append(name, tabs, panels, links);
  view.append(content);
  view.addEventListener("click", () => closeInfo());
  document.body.append(view);
  return view;
}

function getEventPoint(event) {
  const touchPoint =
    event?.touches?.[0] ||
    event?.changedTouches?.[0] ||
    (typeof event?.clientX === "number" ? event : null);
  return touchPoint || null;
}

function setInfoOrigin(event) {
  const point = getEventPoint(event);
  const x = point ? point.clientX : window.innerWidth / 2;
  const y = point ? point.clientY : window.innerHeight / 2;
  pageBody.style.setProperty("--info-origin-x", `${Math.round(x)}px`);
  pageBody.style.setProperty("--info-origin-y", `${Math.round(y)}px`);
}

function setInfoButtonState() {
  if (!infoButton) return;
  infoButton.textContent = "About me";
  infoButton.setAttribute("aria-label", "Open About Me page");
  infoButton.setAttribute("aria-pressed", String(isInfoOpen));
}

function muteAudibleVideosForInfo() {
  infoMutedVideoButtons.clear();
  infoMutedNativeVideos.clear();

  const activeVolumeButtons = document.querySelectorAll(
    ".project-video-unmute[data-muted=\"false\"]"
  );
  activeVolumeButtons.forEach((button) => {
    infoMutedVideoButtons.add(button);
    button.click();
  });

  const nativeVideos = document.querySelectorAll("video");
  nativeVideos.forEach((video) => {
    if (video.muted) return;
    infoMutedNativeVideos.set(video, {
      muted: video.muted,
      volume: Number.isFinite(video.volume) ? video.volume : 1,
    });
    video.muted = true;
    video.setAttribute("muted", "");
  });
}

function restoreVideosMutedForInfo() {
  infoMutedVideoButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement) || !button.isConnected || button.disabled) return;
    const isMuted = button.dataset.muted !== "false";
    if (isMuted) {
      button.click();
    }
  });
  infoMutedVideoButtons.clear();

  infoMutedNativeVideos.forEach((state, video) => {
    if (!video.isConnected) return;
    video.muted = state.muted;
    if (Number.isFinite(state.volume)) {
      video.volume = state.volume;
    }
    if (state.muted) {
      video.setAttribute("muted", "");
    } else {
      video.removeAttribute("muted");
    }
  });
  infoMutedNativeVideos.clear();
}

function openInfo(event) {
  if (isInfoOpen) return;
  isInfoOpen = true;
  muteAudibleVideosForInfo();
  setInfoOrigin(event);
  setInfoButtonState();
  infoView.setAttribute("aria-hidden", "false");

  window.clearTimeout(infoOpeningTimeoutId);
  if (infoOpenFrameId) {
    cancelAnimationFrame(infoOpenFrameId);
    infoOpenFrameId = null;
  }

  pageBody.classList.add("is-info-opening");
  infoOpenFrameId = requestAnimationFrame(() => {
    pageBody.classList.add("is-info-open");
    infoOpenFrameId = null;
  });

  infoOpeningTimeoutId = window.setTimeout(() => {
    pageBody.classList.remove("is-info-opening");
  }, INFO_OPENING_DURATION_MS);
  syncTrailState();
}

function closeInfo() {
  if (!isInfoOpen) return;
  isInfoOpen = false;
  setInfoButtonState();
  restoreVideosMutedForInfo();
  window.clearTimeout(infoOpeningTimeoutId);
  if (infoOpenFrameId) {
    cancelAnimationFrame(infoOpenFrameId);
    infoOpenFrameId = null;
  }
  pageBody.classList.remove("is-info-opening", "is-info-open");
  infoView.setAttribute("aria-hidden", "true");
  syncTrailState();
}

function toggleInfo(event) {
  if (isInfoOpen) {
    closeInfo();
    return;
  }
  openInfo(event);
}

if (infoButton) {
  infoButton.addEventListener("click", toggleInfo);
}
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeInfo();
});

initCategories({
  onProjectOpen: (projectPayload) => {
    // Save scroll position before opening project
    if (galleryPanel) {
      lastScrollPosition = galleryPanel.scrollTop;
    }
    projectPages.openProject(projectPayload);
    syncTrailState();
  },
  onProjectClose: () => {
    const activeProjectCategoryId = projectPages.getCurrentProject?.()?.categoryId || null;
    if (!galleryPanel) {
      projectPages.closeProject();
      syncTrailState();
      return;
    }

    const isMobileViewport = window.matchMedia("(max-width: 640px)").matches;
    const originalScrollBehavior = galleryPanel.style.scrollBehavior;
    galleryPanel.style.scrollBehavior = "auto";

    // On mobile, pre-position to the section before closing the project view.
    // This avoids a visible intermediate jump to another section.
    if (isMobileViewport && activeProjectCategoryId) {
      const sectionId = `gallery-${activeProjectCategoryId}`;
      const sections = Array.from(galleryPanel.querySelectorAll(".gallery-section"));
      const sectionIndex = sections.findIndex((section) => section.id === sectionId);
      const panelHeight = galleryPanel.clientHeight;
      const panelStyles = window.getComputedStyle(galleryPanel);
      const sectionGap =
        Number.parseFloat(panelStyles.rowGap || panelStyles.gap || "0") || 0;

      if (sectionIndex >= 0 && panelHeight > 0) {
        const mobileCategoryTarget = Math.round(sectionIndex * (panelHeight + sectionGap));
        galleryPanel.scrollTop = mobileCategoryTarget;
        projectPages.closeProject();
        galleryPanel.scrollTop = mobileCategoryTarget;
        galleryPanel.dispatchEvent(new Event("scroll"));

        requestAnimationFrame(() => {
          galleryPanel.style.scrollBehavior = originalScrollBehavior;
        });
        syncTrailState();
        return;
      }
    }

    projectPages.closeProject();
    const targetSection =
      isMobileViewport && activeProjectCategoryId
        ? document.getElementById(`gallery-${activeProjectCategoryId}`)
        : null;
    const targetScrollTop =
      targetSection instanceof HTMLElement ? targetSection.offsetTop : lastScrollPosition;

    // Desktop/fallback path: wait until category layout is visible, then restore.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        galleryPanel.scrollTop = targetScrollTop;
        galleryPanel.dispatchEvent(new Event("scroll"));

        setTimeout(() => {
          galleryPanel.style.scrollBehavior = originalScrollBehavior;
        }, 50);
      });
    });

    syncTrailState();
  },
  isProjectOpen: () => projectPages.isOpen(),
});

syncTrailState();

// Watch for body state changes to control trail effect.
const observer = new MutationObserver(syncTrailState);

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

document.addEventListener("visibilitychange", syncTrailState, { passive: true });
