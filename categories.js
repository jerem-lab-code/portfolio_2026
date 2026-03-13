import diveMainImage from "./project_utiliser/3d/Dive/dive.webp";
import kaijuMainImage from "./project_utiliser/3d/Kaiju/plan_large_2_grand.webp";
import clipLondonMainImage from "./project_utiliser/3d/Clip London/london_1.webp";

import sharMeMainImage from "./project_utiliser/3d/SharMe/sharme_1.webp";
import ilandUniverseMainImage from "./project_utiliser/3d/Iland Universe/Rectangle 11.webp";

import tapisMainImage from "./project_utiliser/3d/Tapis/picture_3.webp";
import cadacMainImage from "./project_utiliser/visual identity/CADAC/final_1.webp";
import chefCocoMainImage from "./project_utiliser/visual identity/Chef Coco/chef_coco_story_2.webp";
import beurreMainImage from "./project_utiliser/creative-coding/Beurre/beurre_thumbnail.webp";
import ecosystemMainImage from "./project_utiliser/creative-coding/Ecosystem/img.webp";
import mariageStoryMainImage from "./project_utiliser/creative-coding/Mariage story/test_4.webp";

const pageBody = document.body;
const projectsButton = document.getElementById("projects-button");
const categoryList = document.getElementById("category-list");
const galleryPanel = document.getElementById("gallery-panel");
const categoriesLayout = document.getElementById("categories-layout");
const actionsSection = document.querySelector(".actions");
const actionsAnchor = actionsSection ? document.createComment("actions-anchor") : null;
if (actionsSection?.parentNode && actionsAnchor) {
  actionsSection.parentNode.insertBefore(actionsAnchor, actionsSection);
}

const categories = [
  { id: "3d", label: "3D" },
  { id: "visual-identity", label: "Visual identity" },
  { id: "creative-coding", label: "Creative coding" },
  { id: "poster", label: "Poster" },
  { id: "photo", label: "Photo" },
];

const posterAssetModules = import.meta.glob(
  "./project_utiliser/poster/**/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);
const photoAssetModules = import.meta.glob(
  "./project_utiliser/photo/**/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);
const categoryAssetModules = { ...posterAssetModules, ...photoAssetModules };

const threeDFeaturedProjects = [
  {
    id: "dive",
    projectLabel: "Dive",
    shape: "portrait",
    src: diveMainImage,
    projectPath: "./project_utiliser/3d/Dive",
  },
  {
    id: "kaiju",
    projectLabel: "Kaiju",
    shape: "portrait-tall",
    src: kaijuMainImage,
    projectPath: "./project_utiliser/3d/Kaiju",
  },
  {
    id: "hector",
    projectLabel: "Hector",
    shape: "portrait-tall",
    src: tapisMainImage,
    projectPath: "./project_utiliser/3d/Tapis",
  },

  {
    id: "iland-universe",
    projectLabel: "iland Universe",
    shape: "portrait-tall",
    src: ilandUniverseMainImage,
    projectPath: "./project_utiliser/3d/Iland Universe",
  },
  {
    id: "clip-london",
    projectLabel: "London",
    shape: "portrait",
    src: clipLondonMainImage,
    projectPath: "./project_utiliser/3d/Clip London",
  },
  {
    id: "sharme",
    projectLabel: "SharMe",
    shape: "portrait",
    src: sharMeMainImage,
    projectPath: "./project_utiliser/3d/SharMe",
  },
];

const visualIdentityFeaturedProjects = [
  {
    id: "cadac",
    projectLabel: "CADAC",
    shape: "portrait",
    src: cadacMainImage,
    projectPath: "./project_utiliser/visual identity/CADAC",
  },
  {
    id: "chef-coco",
    projectLabel: "Chef Coco",
    shape: "portrait",
    src: chefCocoMainImage,
    projectPath: "./project_utiliser/visual identity/Chef Coco",
  },
];

const creativeCodingFeaturedProjects = [
  {
    id: "ecosystem",
    projectLabel: "Ecosystem",
    shape: "landscape",
    src: ecosystemMainImage,
    projectPath: "./project_utiliser/creative-coding/Ecosystem",
  },
  {
    id: "beurre",
    projectLabel: "Beurre",
    shape: "portrait",
    src: beurreMainImage,
    projectPath: "./project_utiliser/creative-coding/Beurre",
  },
  {
    id: "mariage-story",
    projectLabel: "Mariage story",
    shape: "portrait",
    src: mariageStoryMainImage,
    projectPath: "./project_utiliser/creative-coding/Mariage story",
  },
];

const featuredProjectsByCategory = {
  "3d": threeDFeaturedProjects,
  "visual-identity": visualIdentityFeaturedProjects,
  "creative-coding": creativeCodingFeaturedProjects,
};

const categoryLabelById = Object.fromEntries(
  categories.map((category) => [category.id, category.label])
);
const detailProjects = Object.entries(featuredProjectsByCategory).flatMap(
  ([categoryId, projects]) =>
    projects
      .filter((project) => project.id && project.projectPath)
      .map((project) => ({
        id: project.id,
        label: project.projectLabel,
        categoryId,
        categoryLabel: categoryLabelById[categoryId] || categoryId,
        mainImageSrc: project.src,
        projectPath: project.projectPath,
      }))
);

function collectCategoryAssets(categoryId) {
  const segment = `/project_utiliser/${categoryId}/`;
  return Object.entries(categoryAssetModules)
    .filter(([assetPath]) => assetPath.includes(segment) && !assetPath.includes("/mobile/"))
    .sort(([left], [right]) =>
      left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
    .map(([path, src]) => ({ path, src }));
}

const categoryAssets = {
  poster: collectCategoryAssets("poster"),
  photo: collectCategoryAssets("photo"),
};

const categoryLayouts = {
  "3d": featuredProjectsByCategory["3d"].map((project) => project.shape),
  "visual-identity": featuredProjectsByCategory["visual-identity"].map(
    (project) => project.shape
  ),
  "creative-coding": featuredProjectsByCategory["creative-coding"].map(
    (project) => project.shape
  ),
  poster: Array.from(
    { length: Math.max(categoryAssets.poster.length, 1) },
    () => "portrait"
  ),
  photo: Array.from(
    { length: Math.max(categoryAssets.photo.length, 1) },
    () => "portrait"
  ),
};

const carouselCategoryIds = new Set(["poster", "photo"]);
const carouselStates = new Map();
const LOOP_SET_COUNT = 5;
const LOOP_CENTER_SET = Math.floor(LOOP_SET_COUNT / 2);
const CAROUSEL_END_SYNC_DELAY_MS = 120;
const TOUCH_AXIS_LOCK_THRESHOLD_PX = 8;
const TOUCH_AXIS_LOCK_BIAS = 1.18;
const MOBILE_RESIZE_IGNORE_HEIGHT_DELTA_PX = 220;
const ROW_MODE_OPTIONS_BY_CATEGORY = Object.freeze({
  poster: [2],
  photo: [2, 3],
});

const categoryButtons = new Map();
const categorySections = new Map();
let isCategoriesView = false;
let scrollLockTimer = null;
let isProgrammaticScroll = false;
let sizingTimer = null;
let panelResizeObserver = null;
let panelScrollRafId = null;
let activeCategoryId = null;
let onProjectOpen = null;
let onProjectClose = null;
let isProjectOpen = () => false;
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;
let lastPanelWidth = galleryPanel?.clientWidth || 0;
let lastPanelHeight = galleryPanel?.clientHeight || 0;

function isPngSource(source) {
  if (typeof source !== "string") return false;
  return /\.png(?:$|[?#])/i.test(source.trim());
}

function isMobileDevice() {
  // Check for touch capability AND mobile user agent
  // This prevents desktop users with small windows from getting mobile images
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return hasTouch && isMobileUA;
}

function shouldIgnoreMobileChromeResize(widthDelta, heightDelta) {
  return (
    isMobileDevice() &&
    widthDelta <= 2 &&
    heightDelta > 0 &&
    heightDelta < MOBILE_RESIZE_IGNORE_HEIGHT_DELTA_PX
  );
}

function updateCategoryPillMetrics() {
  const rootStyle = document.documentElement.style;
  // Keep pill sizing fluid from CSS clamp values instead of freezing to px.
  rootStyle.removeProperty("--category-pill-width");
  rootStyle.removeProperty("--category-pill-height");
}

function shouldNestActionsInCategoriesLayout() {
  return (
    isCategoriesView &&
    !isProjectOpen() &&
    window.matchMedia("(max-width: 640px)").matches
  );
}

function syncActionsPlacement() {
  if (!actionsSection || !actionsAnchor || !actionsAnchor.parentNode || !categoriesLayout)
    return;

  const shouldNest = shouldNestActionsInCategoriesLayout();

  if (shouldNest) {
    if (actionsSection.parentElement !== categoriesLayout) {
      categoriesLayout.append(actionsSection);
    }
  } else if (actionsSection.parentNode !== actionsAnchor.parentNode) {
    actionsAnchor.parentNode.insertBefore(actionsSection, actionsAnchor.nextSibling);
  }

  pageBody.classList.toggle("is-actions-nested", shouldNest);
}

function getLayoutRowCount(layout, columns, portraitSpan, landscapeSpan) {
  if (!layout.length) return 1;
  const occupiedRows = [];
  let maxUsedRow = 1;

  const ensureRow = (rowIndex) => {
    while (occupiedRows.length <= rowIndex) {
      occupiedRows.push(Array(columns).fill(false));
    }
  };

  const canPlace = (startRow, startCol, colSpan, rowSpan) => {
    for (let row = startRow; row < startRow + rowSpan; row += 1) {
      ensureRow(row);
      for (let col = startCol; col < startCol + colSpan; col += 1) {
        if (occupiedRows[row][col]) return false;
      }
    }
    return true;
  };

  const place = (startRow, startCol, colSpan, rowSpan) => {
    for (let row = startRow; row < startRow + rowSpan; row += 1) {
      ensureRow(row);
      for (let col = startCol; col < startCol + colSpan; col += 1) {
        occupiedRows[row][col] = true;
      }
    }
    maxUsedRow = Math.max(maxUsedRow, startRow + rowSpan);
  };

  layout.forEach((shape) => {
    const colSpan = shape === "landscape" ? landscapeSpan : portraitSpan;
    const rowSpan = shape === "portrait-tall" ? 2 : 1;

    let placed = false;
    let row = 0;
    while (!placed) {
      for (let col = 0; col <= columns - colSpan; col += 1) {
        if (!canPlace(row, col, colSpan, rowSpan)) continue;
        place(row, col, colSpan, rowSpan);
        placed = true;
        break;
      }
      row += 1;
    }
  });

  return Math.max(maxUsedRow, 1);
}

function updateSectionSizing() {
  if (!isCategoriesView) return;
  const panelHeight = galleryPanel.clientHeight;
  if (!panelHeight) return;

  categorySections.forEach((section, id) => {
    const layout = categoryLayouts[id] || [];
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const isCarousel = section.classList.contains("is-carousel");
    const carouselScale = 1.3;
    const carouselTarget = panelHeight * (isMobile ? 0.6 : 0.72) * carouselScale;
    const carouselMin = (isMobile ? 200 : 240) * carouselScale;
    const carouselMax = (isMobile ? 360 : 520) * carouselScale;
    let carouselHeight = Math.round(
      Math.max(carouselMin, Math.min(carouselTarget, carouselMax))
    );
    const carouselCeiling = Math.round(panelHeight * 0.92);
    if (carouselHeight > carouselCeiling) carouselHeight = carouselCeiling;
    const carouselWidth = Math.round(carouselHeight * 0.68);
    const useCompactGrid = layout.length <= 3;
    const columns = isMobile ? 4 : useCompactGrid ? 6 : 12;
    const portraitSpan = isMobile ? 2 : useCompactGrid ? 3 : 4;
    const landscapeSpan = isMobile ? 4 : useCompactGrid ? 6 : 8;
    const isVisualIdentityHorizontal =
      id === "visual-identity" &&
      window.matchMedia("(max-width: 1170px)").matches;
    const sizingLayout = isVisualIdentityHorizontal
      ? layout.map(() => "landscape")
      : layout;
    const rows = getLayoutRowCount(
      sizingLayout,
      columns,
      portraitSpan,
      landscapeSpan
    );
    const grid = section.querySelector(".gallery-grid");
    const gridStyles = grid ? getComputedStyle(grid) : null;
    const rowGap = gridStyles ? Number.parseFloat(gridStyles.rowGap) || 0 : 0;
    const availableHeight = panelHeight;
    const totalGaps = rowGap * Math.max(rows - 1, 0);
    const cardHeight = Math.max(
      80,
      Math.floor((availableHeight - totalGaps) / rows)
    );

    section.style.setProperty("--gallery-section-height", `${panelHeight}px`);
    section.style.minHeight = `${panelHeight}px`;
    section.style.setProperty("--carousel-card-height", `${carouselHeight}px`);
    section.style.setProperty("--carousel-card-width", `${carouselWidth}px`);

    if (isCarousel) return;

    section.style.setProperty("--gallery-columns", `${columns}`);
    section.style.setProperty("--portrait-span", `${portraitSpan}`);
    section.style.setProperty("--landscape-span", `${landscapeSpan}`);
    section.style.setProperty("--section-card-height", `${cardHeight}px`);
  });
}

function scheduleSectionSizing() {
  updateSectionSizing();
  updateCarouselsLayout();
  requestAnimationFrame(updateSectionSizing);
  requestAnimationFrame(updateCarouselsLayout);
  window.clearTimeout(sizingTimer);
  sizingTimer = window.setTimeout(() => {
    updateSectionSizing();
    updateCarouselsLayout();
  }, 650);
}

function startPanelObserver() {
  // Mobile browsers frequently change viewport height while scrolling
  // (address bar show/hide), which can cause layout reflow jumps.
  if (isMobileDevice()) return;
  if (panelResizeObserver || !("ResizeObserver" in window)) return;
  panelResizeObserver = new ResizeObserver((entries) => {
    const entry = entries?.[0];
    if (entry?.contentRect) {
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      const widthDelta = Math.abs(nextWidth - lastPanelWidth);
      const heightDelta = Math.abs(nextHeight - lastPanelHeight);
      lastPanelWidth = nextWidth;
      lastPanelHeight = nextHeight;
      if (shouldIgnoreMobileChromeResize(widthDelta, heightDelta)) return;
    }
    updateSectionSizing();
  });
  panelResizeObserver.observe(galleryPanel);
}

function placeholderColor(index) {
  const palette = ["#161616", "#1f1f1f", "#292929", "#303030", "#373737"];
  return palette[index % palette.length];
}

function makePlaceholder(label, shape, index) {
  const width = shape === "landscape" ? 1900 : 900;
  const height = 1200;
  const color = placeholderColor(index);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" />
          <stop offset="100%" stop-color="#0d0d0d" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad${index})" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#f2f2f2" font-size="${shape === "landscape" ? 80 : 56}"
        font-family="Suisse Intl book, Helvetica Neue, Arial, sans-serif">
        ${label}
      </text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getCarouselRowIconMarkup(rowCount) {
  if (rowCount === 3) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect class="row-icon-block" x="8.3" y="4.7" width="7.4" height="3.1" rx="1.2" />
        <rect class="row-icon-gap" x="7.4" y="9.4" width="9.2" height="1.2" rx="0.6" />
        <rect class="row-icon-block" x="8.3" y="11.2" width="7.4" height="3.1" rx="1.2" />
        <rect class="row-icon-gap" x="7.4" y="15.9" width="9.2" height="1.2" rx="0.6" />
        <rect class="row-icon-block" x="8.3" y="17.7" width="7.4" height="3.1" rx="1.2" />
      </svg>
    `.trim();
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect class="row-icon-block" x="8.3" y="5.8" width="7.4" height="4.7" rx="1.6" />
      <rect class="row-icon-gap" x="7.4" y="11.8" width="9.2" height="1.4" rx="0.7" />
      <rect class="row-icon-block" x="8.3" y="14.5" width="7.4" height="4.7" rx="1.6" />
    </svg>
  `.trim();
}

function createCarouselIndicator(count, options = {}) {
  const { rowModes = [] } = options;
  const dock = document.createElement("div");
  dock.className = "carousel-indicator-dock";

  const indicator = document.createElement("div");
  indicator.className = "carousel-indicator";
  const dotsRow = document.createElement("div");
  dotsRow.className = "carousel-dots";
  const visibleDotCount = Math.min(count, 7);
  const dots = [];
  for (let i = 0; i < visibleDotCount; i += 1) {
    const dot = document.createElement("span");
    dot.className = "carousel-dot";
    if (i === 0) dot.classList.add("is-active");
    dotsRow.append(dot);
    dots.push(dot);
  }
  indicator.append(dotsRow);
  const counter = document.createElement("span");
  counter.className = "carousel-counter";
  counter.textContent = formatCarouselCounter(0, count);
  indicator.append(counter);
  dock.append(indicator);

  const rowButtons = [];
  if (rowModes.length > 0) {
    const controls = document.createElement("div");
    controls.className = "carousel-row-controls";
    rowModes.forEach((rowCount) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "carousel-row-toggle";
      button.dataset.rowCount = `${rowCount}`;
      button.setAttribute("aria-label", `Activer la vue en ${rowCount} rangees`);
      button.setAttribute("aria-pressed", "false");
      const icon = document.createElement("span");
      icon.className = "carousel-row-toggle-icon";
      icon.innerHTML = getCarouselRowIconMarkup(rowCount);
      button.append(icon);
      controls.append(button);
      rowButtons.push(button);
    });
    dock.append(controls);
  }

  return { indicatorDock: dock, indicator, dots, counter, visibleDotCount, rowButtons };
}

function createCarouselCard(category, index, categoryIndex, imageSrc, isMobile = false) {
  const card = document.createElement("figure");
  card.className = "project-card carousel-card";
  card.dataset.carouselIndex = `${index}`;
  card.style.setProperty("--carousel-image-ratio", "0.68");
  const image = document.createElement("img");
  image.alt = `${category.label} project ${index + 1}`;
  image.draggable = false;
  // Reserve stable dimensions to avoid layout shifts while assets decode.
  image.width = 680;
  image.height = 1000;
  // On mobile, preload a few more slides to reduce visible loading pops during swipe.
  const eagerThreshold = isMobile ? 6 : 3;
  image.loading = index < eagerThreshold ? "eager" : "lazy";
  image.decoding = "async";
  image.fetchPriority = index === 0 ? "high" : index < eagerThreshold ? "auto" : "low";

  image.src = imageSrc || makePlaceholder(category.label, "portrait", categoryIndex * 10 + index);

  const resolvedSrc = image.src;
  if (isPngSource(resolvedSrc)) {
    card.classList.add("is-png");
  }
  const shouldShowCaption =
    category.id !== "poster" && category.id !== "photo";
  if (shouldShowCaption) {
    const caption = document.createElement("figcaption");
    caption.textContent = `${category.label} project ${index + 1}`;
    card.append(image, caption);
  } else {
    card.append(image);
  }
  return card;
}

function getSlideCenter(slide) {
  return slide.offsetLeft + slide.offsetWidth / 2;
}

function findClosestCenterIndex(centers, value) {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  centers.forEach((center, index) => {
    const distance = Math.abs(center - value);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return closestIndex;
}

function formatCarouselCounter(index, count) {
  const safeCount = Math.max(count, 1);
  const digits = String(safeCount).length;
  const current = ((index % safeCount) + safeCount) % safeCount;
  return `${String(current + 1).padStart(digits, "0")}/${String(safeCount).padStart(
    digits,
    "0"
  )}`;
}

function getLoopMetrics(state) {
  const { slides, count, slideSets } = state;
  if (!slides.length || count < 1) return null;
  if (slides.length < count * LOOP_SET_COUNT) return null;
  const firstSetStart = slides[0].offsetLeft;
  const nextSetStart = slides[count].offsetLeft;
  const setSpan = nextSetStart - firstSetStart;
  if (!setSpan) return null;
  const middleSlides = slideSets[LOOP_CENTER_SET];
  if (!middleSlides || middleSlides.length < count) return null;
  const centers = middleSlides.map((slide) => getSlideCenter(slide));
  const centerSetStart = slides[count * LOOP_CENTER_SET].offsetLeft;
  const leftBoundary = slides[count * (LOOP_CENTER_SET - 1)].offsetLeft;
  const rightBoundary = slides[count * (LOOP_CENTER_SET + 2)].offsetLeft;
  return {
    centerSetStart,
    leftBoundary,
    rightBoundary,
    setSpan,
    middleSlides,
    centers,
  };
}

function updateCarouselIndicator(state, index) {
  const safeIndex = ((index % state.count) + state.count) % state.count;
  const { visibleDotCount } = state;
  const displayIndex =
    state.count <= visibleDotCount
      ? safeIndex
      : Math.round((safeIndex / (state.count - 1)) * (visibleDotCount - 1));

  if (state.activeDisplayIndex !== displayIndex) {
    if (state.dots[state.activeDisplayIndex]) {
      state.dots[state.activeDisplayIndex].classList.remove("is-active");
    }
    if (state.dots[displayIndex]) {
      state.dots[displayIndex].classList.add("is-active");
    }
    state.activeDisplayIndex = displayIndex;
  }

  state.counter.textContent = formatCarouselCounter(safeIndex, state.count);

  state.activeIndex = safeIndex;
}

function getVisibleSlides(state) {
  if (state.activeRowCount === 1) return state.slides;
  return state.slides.filter((slide) => !slide.hidden);
}

function updateCarouselIndicatorClearance(state) {
  const dock = state.indicatorDock;
  if (!dock?.isConnected) return;

  const indicator = state.indicator;
  if (indicator?.isConnected) {
    const indicatorHeight = Math.ceil(indicator.getBoundingClientRect().height);
    if (indicatorHeight) {
      dock.style.setProperty("--carousel-indicator-height", `${indicatorHeight}px`);
    }
  }

  const dockRect = dock.getBoundingClientRect();
  if (!dockRect.height) return;

  const dockBottom = Number.parseFloat(window.getComputedStyle(dock).bottom) || 0;
  const clearance = Math.max(40, Math.ceil(dockRect.height + dockBottom + 8));
  state.track.style.setProperty("--carousel-indicator-clearance", `${clearance}px`);
}

function getRowModeScale(rowCount) {
  if (rowCount === 2) return 0.5;
  if (rowCount === 3) return 0.36;
  return 1;
}

function setCarouselRowMode(state, requestedRowCount) {
  const allowedRowModes = state.rowModes || [];
  const rowButtons = state.rowButtons || [];
  const numericRowCount = Number.parseInt(String(requestedRowCount), 10);
  const nextRowCount =
    Number.isFinite(numericRowCount) &&
    numericRowCount > 1 &&
    allowedRowModes.includes(numericRowCount)
      ? numericRowCount
      : 1;
  const isMultiRowMode = nextRowCount > 1;

  state.activeRowCount = nextRowCount;
  state.section.classList.toggle("is-multi-rows", isMultiRowMode);
  state.track.classList.toggle("is-multi-rows", isMultiRowMode);
  state.slides.forEach((slide) => {
    const setIndex = Number.parseInt(slide.dataset.carouselSet || "0", 10);
    slide.hidden = isMultiRowMode && setIndex !== 0;
  });

  if (isMultiRowMode) {
    state.track.style.setProperty("--carousel-row-count", `${nextRowCount}`);
    state.track.style.setProperty("--carousel-row-scale", `${getRowModeScale(nextRowCount)}`);
    state.track.style.setProperty(
      "--carousel-row-gap",
      nextRowCount === 3 ? "clamp(12px, 2.3vh, 20px)" : "clamp(20px, 4.2vh, 34px)"
    );
    state.track.style.setProperty(
      "--carousel-row-column-gap",
      nextRowCount === 3 ? "clamp(10px, 2.2vw, 18px)" : "clamp(12px, 2.8vw, 22px)"
    );
    state.track.style.setProperty(
      "--carousel-row-padding-block",
      nextRowCount === 3 ? "clamp(9px, 1.9vh, 16px)" : "clamp(12px, 2.6vh, 22px)"
    );
  } else {
    state.track.style.removeProperty("--carousel-row-count");
    state.track.style.removeProperty("--carousel-row-scale");
    state.track.style.removeProperty("--carousel-row-gap");
    state.track.style.removeProperty("--carousel-row-column-gap");
    state.track.style.removeProperty("--carousel-row-padding-block");
  }

  rowButtons.forEach((button) => {
    const buttonRowCount = Number.parseInt(button.dataset.rowCount || "1", 10);
    const isActive = isMultiRowMode && buttonRowCount === nextRowCount;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.setAttribute(
      "aria-label",
      isActive
        ? `Desactiver la vue en ${buttonRowCount} rangees`
        : `Activer la vue en ${buttonRowCount} rangees`
    );
  });
  updateCarouselIndicatorClearance(state);
  if (typeof state.updateTouchHandlers === "function") {
    state.updateTouchHandlers();
  }

  if (isMultiRowMode) {
    state.track.scrollLeft = 0;
    state.hasPositioned = true;
    syncCarousel(state);
    return;
  }
  state.hasPositioned = false;
  scheduleCarouselSync(state);
}

function positionCarousel(state, index = 0) {
  if (state.activeRowCount > 1) return false;
  const safeIndex = ((index % state.count) + state.count) % state.count;
  const metrics = getLoopMetrics(state);
  if (!metrics) return false;
  const targetSlide = metrics.middleSlides[safeIndex];
  if (!targetSlide) return false;
  const target = getSlideCenter(targetSlide) - state.track.clientWidth / 2;
  state.track.scrollLeft = target;
  updateCarouselIndicator(state, safeIndex);
  state.hasPositioned = true;
  return true;
}

function syncCarousel(state) {
  const { track } = state;

  if (state.activeRowCount > 1) {
    const visibleSlides = getVisibleSlides(state);
    if (!visibleSlides.length || !state.count) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    for (let i = 0; i < visibleSlides.length; i += 1) {
      const slide = visibleSlides[i];
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - slideCenter);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }
    const targetSlide = visibleSlides[closestIndex];
    if (targetSlide && targetSlide.dataset.carouselIndex) {
      const realIndex = Number.parseInt(targetSlide.dataset.carouselIndex, 10);
      if (!Number.isNaN(realIndex)) {
        updateCarouselIndicator(state, realIndex);
      }
    }
    return;
  }

  // Mobile: Just update indicator based on scroll position, no infinite loop jumps
  if (state.isMobile) {
    if (!state.slides.length || !state.count) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    // Find the closest slide to the center
    for (let i = 0; i < state.slides.length; i++) {
      const slide = state.slides[i];
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - slideCenter);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }

    // Extract the real index from the closest slide's dataset
    const targetSlide = state.slides[closestIndex];
    if (targetSlide && targetSlide.dataset.carouselIndex) {
      const realIndex = parseInt(targetSlide.dataset.carouselIndex, 10);
      updateCarouselIndicator(state, realIndex);
    }
    return;
  }

  // Desktop Infinite Loop Logic
  if (!state.hasPositioned) {
    const positioned = positionCarousel(state, state.activeIndex || 0);
    if (positioned) return;
  }
  if (!state.slides.length) return;
  const metrics = getLoopMetrics(state);
  if (!metrics) return;
  const { centerSetStart, leftBoundary, rightBoundary, setSpan, centers } = metrics;

  let center = track.scrollLeft + track.clientWidth / 2;

  // Handle infinite loop wrapping
  if (center < leftBoundary || center >= rightBoundary) {
    const rawOffset = track.scrollLeft - centerSetStart;
    const normalizedOffset = ((rawOffset % setSpan) + setSpan) % setSpan;
    track.scrollLeft = centerSetStart + normalizedOffset;
    center = track.scrollLeft + track.clientWidth / 2;
  }

  // Normalize center into the middle set span so index tracking stays correct
  const centerOffset = center - centerSetStart;
  const normalizedCenter =
    centerSetStart + (((centerOffset % setSpan) + setSpan) % setSpan);

  const closestIndex = findClosestCenterIndex(centers, normalizedCenter);
  updateCarouselIndicator(state, closestIndex);
}

function scheduleCarouselSync(state) {
  if (state.syncFrameId) return;
  state.syncFrameId = requestAnimationFrame(() => {
    state.syncFrameId = null;
    syncCarousel(state);
  });
}

function scheduleCarouselEndSync(state) {
  window.clearTimeout(state.settleTimeoutId);
  state.settleTimeoutId = window.setTimeout(() => {
    scheduleCarouselSync(state);
  }, CAROUSEL_END_SYNC_DELAY_MS);
}

function updateCarouselsLayout() {
  carouselStates.forEach((state) => {
    updateCarouselIndicatorClearance(state);
    if (state.activeRowCount > 1) return;
    const positioned = positionCarousel(state, state.activeIndex || 0);
    if (!positioned) {
      scheduleCarouselSync(state);
    }
  });
}

function initCarousels() {
  carouselStates.forEach((state) => {
    if (state.isInit) return;
    state.isInit = true;
    state.syncFrameId = null;
    state.settleTimeoutId = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastY = 0;
    let touchAxis = null;
    let isTouchDragging = false;
    let areTouchHandlersBound = false;

    const onInteractionStart = () => {
      state.isInteracting = true;
    };
    const onInteractionEnd = () => {
      if (!state.isInteracting) return;
      state.isInteracting = false;
      scheduleCarouselEndSync(state);
    };
    const onTouchStart = (event) => {
      onInteractionStart();
      const touch = event.touches?.[0];
      if (!touch) return;
      isTouchDragging = true;
      touchAxis = null;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchLastY = touch.clientY;
    };
    const onTouchMove = (event) => {
      if (!isTouchDragging) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (!touchAxis) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        if (
          absDeltaX < TOUCH_AXIS_LOCK_THRESHOLD_PX &&
          absDeltaY < TOUCH_AXIS_LOCK_THRESHOLD_PX
        ) {
          return;
        }
        if (absDeltaY > absDeltaX * TOUCH_AXIS_LOCK_BIAS) {
          touchAxis = "vertical";
        } else if (absDeltaX > absDeltaY * TOUCH_AXIS_LOCK_BIAS) {
          touchAxis = "horizontal";
        } else {
          return;
        }
      }

      // Keep single-row mobile carousel fully native to avoid gesture handoff jumps.
      if (state.activeRowCount === 1) return;
      if (touchAxis !== "vertical") return;
      // Let vertical gestures scroll the categories panel even when started on an image.
      const moveDeltaY = touchLastY - touch.clientY;
      touchLastY = touch.clientY;
      if (!moveDeltaY) return;
      galleryPanel.scrollTop += moveDeltaY;
      if (event.cancelable) {
        event.preventDefault();
      }
    };
    const onTouchEnd = () => {
      isTouchDragging = false;
      touchAxis = null;
      onInteractionEnd();
    };
    const setTouchHandlersBound = (shouldBind) => {
      if (!state.isMobile) return;
      if (shouldBind && !areTouchHandlersBound) {
        state.track.addEventListener("touchstart", onTouchStart, { passive: true });
        state.track.addEventListener("touchmove", onTouchMove, { passive: false });
        state.track.addEventListener("touchend", onTouchEnd, { passive: true });
        state.track.addEventListener("touchcancel", onTouchEnd, { passive: true });
        areTouchHandlersBound = true;
        return;
      }
      if (!shouldBind && areTouchHandlersBound) {
        state.track.removeEventListener("touchstart", onTouchStart);
        state.track.removeEventListener("touchmove", onTouchMove);
        state.track.removeEventListener("touchend", onTouchEnd);
        state.track.removeEventListener("touchcancel", onTouchEnd);
        isTouchDragging = false;
        touchAxis = null;
        areTouchHandlersBound = false;
      }
    };
    state.updateTouchHandlers = () => {
      // Only bind the custom touch handoff in multi-row mode.
      setTouchHandlersBound(state.activeRowCount > 1);
    };
    state.track.addEventListener(
      "scroll",
      () => {
        if (state.isMobile && state.activeRowCount === 1) {
          // Keep mobile single-row mode native: update on scroll settle.
          scheduleCarouselEndSync(state);
          return;
        }
        // Multi-row modes update live so dots/counter always match scroll progress.
        scheduleCarouselSync(state);
      },
      { passive: true }
    );
    state.track.addEventListener("pointerdown", onInteractionStart, { passive: true });
    window.addEventListener("pointerup", onInteractionEnd, { passive: true });
    state.rowButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const rowCount = Number.parseInt(button.dataset.rowCount || "1", 10);
        const shouldResetToSingleRow = state.activeRowCount === rowCount;
        setCarouselRowMode(state, shouldResetToSingleRow ? 1 : rowCount);
      });
    });
    setCarouselRowMode(state, state.activeRowCount);
    state.updateTouchHandlers();
    requestAnimationFrame(() => updateCarouselIndicatorClearance(state));
    scheduleCarouselSync(state);
  });
  updateCarouselsLayout();
}

function openProjectDetail(featuredProject, categoryId) {
  if (typeof onProjectOpen !== "function") return;
  if (!featuredProject?.id || !featuredProject?.projectPath) return;

  onProjectOpen({
    id: featuredProject.id,
    label: featuredProject.projectLabel,
    categoryId,
    categoryLabel: categoryLabelById[categoryId] || categoryId,
    mainImageSrc: featuredProject.src,
    projectPath: featuredProject.projectPath,
    allProjects: detailProjects,
  });

  projectsButton.textContent = "Back";
  projectsButton.setAttribute("aria-label", "Retour aux categories");
  syncActionsPlacement();
}

function setActiveCategory(categoryId) {
  if (activeCategoryId === categoryId) return;
  activeCategoryId = categoryId;
  categoryButtons.forEach((button, id) => {
    button.classList.toggle("is-active", id === categoryId);
  });
}

function scrollToCategory(categoryId, behavior = "smooth") {
  const section = categorySections.get(categoryId);
  if (!section) return;
  const target = getSectionScrollTarget(section);
  isProgrammaticScroll = true;
  galleryPanel.scrollTo({ top: target, behavior });
  setActiveCategory(categoryId);
  window.clearTimeout(scrollLockTimer);
  scrollLockTimer = window.setTimeout(() => {
    isProgrammaticScroll = false;
  }, behavior === "smooth" ? 520 : 180);
}

function getSectionScrollTarget(section) {
  return section.offsetTop;
}

function syncCategoryFromScroll() {
  if (!isCategoriesView || isProgrammaticScroll || isProjectOpen()) return;
  const pivot = galleryPanel.scrollTop + galleryPanel.clientHeight * 0.28;
  let nextActiveCategoryId = categories[0].id;
  categories.forEach((category) => {
    const section = categorySections.get(category.id);
    if (section && section.offsetTop <= pivot) nextActiveCategoryId = category.id;
  });
  setActiveCategory(nextActiveCategoryId);
}

function handleGalleryPanelScroll() {
  if (panelScrollRafId) return;
  panelScrollRafId = requestAnimationFrame(() => {
    panelScrollRafId = null;
    syncCategoryFromScroll();
  });
}

function renderCategorySections() {
  categories.forEach((category, categoryIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.dataset.category = category.id;
    button.textContent = category.label;
    button.addEventListener("click", () => scrollToCategory(category.id));
    categoryButtons.set(category.id, button);
    categoryList.append(button);

    const section = document.createElement("section");
    section.className = "gallery-section";
    section.dataset.category = category.id;
    section.id = `gallery-${category.id}`;

    const layout = categoryLayouts[category.id] || categoryLayouts["3d"];
    if (carouselCategoryIds.has(category.id)) {
      section.classList.add("is-carousel");
      const carousel = document.createElement("div");
      carousel.className = "gallery-carousel";
      const track = document.createElement("div");
      track.className = "carousel-track";
      track.dataset.carousel = category.id;
      const assets = categoryAssets[category.id] || [];
      const isMobile = isMobileDevice();

      const slides = [];
      const slideSets = [];

      // Mobile: Only 1 copy of images (no infinite loop)
      // Desktop: 5 copies for infinite scrolling
      const loopCount = isMobile ? 1 : LOOP_SET_COUNT;

      for (let setIndex = 0; setIndex < loopCount; setIndex += 1) {
        const setSlides = [];
        assets.forEach((asset, index) => {
          let imageSrc = asset.src;

          // Try to load mobile variant if on mobile
          if (isMobile && asset.path) {
            // The asset.path looks like: ./project_utiliser/photo/DSC0156/DSC0156.webp
            // We want: ./project_utiliser/photo/mobile/DSC0156/DSC0156.jpg
            // Extract the parts and reconstruct
            const pathMatch = asset.path.match(/^(.+\/(photo|poster))\/([^\/]+)\/([^\/]+)\.(webp|jpg|jpeg|png|avif)$/i);
            if (pathMatch) {
              const [, basePath, category, folder, filename] = pathMatch;
              const mobilePath = `${basePath}/mobile/${folder}/${filename}.jpg`;

              // Check if this mobile asset exists in our modules
              if (categoryAssetModules[mobilePath]) {
                imageSrc = categoryAssetModules[mobilePath];
              }
            }
          }

          const card = createCarouselCard(category, index, categoryIndex, imageSrc, isMobile);
          card.dataset.carouselSet = `${setIndex}`;
          setSlides.push(card);
          slides.push(card);
          track.append(card);
        });
        slideSets.push(setSlides);
      }

      const slideCount = assets.length || 1;
      const rowModes = ROW_MODE_OPTIONS_BY_CATEGORY[category.id] || [];
      const {
        indicatorDock,
        indicator,
        dots,
        counter,
        visibleDotCount,
        rowButtons,
      } = createCarouselIndicator(slideCount, { rowModes });
      carousel.append(track, indicatorDock);
      section.append(carousel);
      carouselStates.set(category.id, {
        section,
        track,
        indicatorDock,
        indicator,
        isMobile,
        dots,
        counter,
        visibleDotCount,
        rowButtons,
        rowModes,
        activeRowCount: 1,
        slides,
        slideSets,
        count: slideCount,
        activeIndex: 0,
        activeDisplayIndex: 0,
        isInit: false,
        isInteracting: false,
        hasPositioned: false,
        syncFrameId: null,
        settleTimeoutId: null,
      });
    } else {
      const grid = document.createElement("div");
      grid.className = "gallery-grid";
      const featuredProjects = featuredProjectsByCategory[category.id] || null;

      layout.forEach((shape, index) => {
        const card = document.createElement("figure");
        card.className = `project-card ${shape}`;
        const image = document.createElement("img");
        const featuredProject = featuredProjects?.[index];
        image.alt = featuredProject
          ? `${featuredProject.projectLabel} project image`
          : `${category.label} project ${index + 1}`;
        // Eager load first 6 cards (visible on page load), lazy load rest
        image.loading = index < 6 ? "eager" : "lazy";
        const resolvedSrc =
          featuredProject?.src ||
          makePlaceholder(category.label, shape, categoryIndex * 10 + index);
        image.src = resolvedSrc;
        if (isPngSource(resolvedSrc)) {
          card.classList.add("is-png");
        }
        const caption = document.createElement("figcaption");
        caption.textContent = featuredProject
          ? featuredProject.projectLabel
          : `${category.label} project ${index + 1}`;
        card.append(image, caption);

        const canOpenProjectDetail = Boolean(
          featuredProject?.id &&
          featuredProject?.projectPath &&
          !carouselCategoryIds.has(category.id)
        );
        if (canOpenProjectDetail) {
          card.classList.add("is-clickable");
          card.tabIndex = 0;
          card.setAttribute("role", "button");

          const handleOpen = () => openProjectDetail(featuredProject, category.id);
          card.addEventListener("click", handleOpen);
          card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            handleOpen();
          });
        }

        grid.append(card);
      });

      section.append(grid);
    }

    galleryPanel.append(section);
    categorySections.set(category.id, section);
  });
  setActiveCategory(categories[0].id);
}

function enterCategoriesView() {
  if (isCategoriesView) {
    scrollToCategory(categories[0].id);
    return;
  }
  updateCategoryPillMetrics();
  isCategoriesView = true;
  pageBody.classList.add("is-categories");
  syncActionsPlacement();
  projectsButton.textContent = "↓";
  projectsButton.setAttribute("aria-label", "Retour à l’accueil");
  requestAnimationFrame(() => {
    scheduleSectionSizing();
    scrollToCategory(categories[0].id, "auto");
    updateCarouselsLayout();
  });
}

function exitCategoriesView() {
  if (!isCategoriesView) return;
  if (isProjectOpen() && typeof onProjectClose === "function") {
    onProjectClose();
  }
  isCategoriesView = false;
  pageBody.classList.remove("is-categories");
  syncActionsPlacement();
  projectsButton.textContent = "Projects";
  projectsButton.setAttribute("aria-label", "Voir les categories");
  galleryPanel.scrollTo({ top: 0, behavior: "auto" });
  window.setTimeout(() => {
    setActiveCategory(categories[0].id);
  }, 200);
}

function handleProjectsButton() {
  if (isProjectOpen()) {
    if (typeof onProjectClose === "function") onProjectClose();
    projectsButton.textContent = "↓";
    projectsButton.setAttribute("aria-label", "Retour à l’accueil");
    syncActionsPlacement();
    return;
  }

  if (isCategoriesView) {
    exitCategoriesView();
  } else {
    enterCategoriesView();
  }
}

export function initCategories(options = {}) {
  onProjectOpen =
    typeof options.onProjectOpen === "function" ? options.onProjectOpen : null;
  onProjectClose =
    typeof options.onProjectClose === "function" ? options.onProjectClose : null;
  isProjectOpen =
    typeof options.isProjectOpen === "function" ? options.isProjectOpen : () => false;

  renderCategorySections();
  initCarousels();
  updateCategoryPillMetrics();
  syncActionsPlacement();
  startPanelObserver();

  projectsButton.addEventListener("click", handleProjectsButton);
  galleryPanel.addEventListener("scroll", handleGalleryPanelScroll, { passive: true });
  window.addEventListener("resize", () => {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const widthDelta = Math.abs(nextWidth - lastViewportWidth);
    const heightDelta = Math.abs(nextHeight - lastViewportHeight);
    const ignoreChromeResize = shouldIgnoreMobileChromeResize(
      widthDelta,
      heightDelta
    );
    lastViewportWidth = nextWidth;
    lastViewportHeight = nextHeight;
    if (ignoreChromeResize) return;

    if (panelScrollRafId) {
      cancelAnimationFrame(panelScrollRafId);
      panelScrollRafId = null;
    }
    updateCategoryPillMetrics();
    syncActionsPlacement();
    scheduleSectionSizing();
  });
}
