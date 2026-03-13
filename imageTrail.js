import diveMainImage from "./project_utiliser/3d/Dive/dive.webp";
import beurreMainImage from "./project_utiliser/creative-coding/Beurre/beurre_thumbnail.webp";

const trailAssetModules = import.meta.glob(
  "./project_utiliser/creative-coding/Ecosystem/assets/thumbnails/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);

const MAX_THUMBNAILS_PER_PROJECT = 3;
const MAX_THUMBNAILS_PER_3D_PROJECT = 5;
const MAX_PROJECTS_BY_CATEGORY = {
  "3d": 8,
  "visual-identity": 2,
  "creative-coding": 2,
  photo: 6,
  poster: 1,
  other: 1,
};

function getThumbnailCategoryFromPath(assetPath) {
  const fileName = assetPath.split("/").pop() || assetPath;
  const stem = fileName.replace(/\.[^/.]+$/, "");
  if (stem.startsWith("3d-")) return "3d";
  if (stem.startsWith("visual identity-")) return "visual-identity";
  if (stem.startsWith("creative-coding-")) return "creative-coding";
  if (stem.startsWith("photo-")) return "photo";
  if (stem.startsWith("poster-")) return "poster";
  return "other";
}

function getProjectKeyFromThumbnailPath(assetPath) {
  const fileName = assetPath.split("/").pop() || assetPath;
  const stem = fileName.replace(/\.[^/.]+$/, "");
  const segments = stem
    .split("-")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length < 2) return stem;
  return `${segments[0]}-${segments[1]}`;
}

const groupedTrailAssets = new Map();
Object.entries(trailAssetModules)
  .sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  )
  .forEach(([assetPath, src]) => {
    const category = getThumbnailCategoryFromPath(assetPath);
    const projectKey = `${category}:${getProjectKeyFromThumbnailPath(assetPath)}`;
    const existingEntry = groupedTrailAssets.get(projectKey) || {
      category,
      assets: [],
    };
    const maxPerProject =
      category === "3d"
        ? MAX_THUMBNAILS_PER_3D_PROJECT
        : MAX_THUMBNAILS_PER_PROJECT;
    if (existingEntry.assets.length >= maxPerProject) return;
    existingEntry.assets.push(src);
    groupedTrailAssets.set(projectKey, existingEntry);
  });

const projectsByCategory = new Map();
groupedTrailAssets.forEach((entry) => {
  if (!entry.assets.length) return;
  const categoryProjects = projectsByCategory.get(entry.category) || [];
  categoryProjects.push(entry.assets);
  projectsByCategory.set(entry.category, categoryProjects);
});

const selectedImagePool = [];
const handledCategories = new Set();

Object.entries(MAX_PROJECTS_BY_CATEGORY).forEach(([category, maxProjects]) => {
  handledCategories.add(category);
  const categoryProjects = projectsByCategory.get(category) || [];
  categoryProjects.slice(0, maxProjects).forEach((projectAssets) => {
    selectedImagePool.push(...projectAssets);
  });
});

projectsByCategory.forEach((categoryProjects, category) => {
  if (handledCategories.has(category)) return;
  categoryProjects.forEach((projectAssets) => {
    selectedImagePool.push(...projectAssets);
  });
});

const imagePool = selectedImagePool;

const fallbackPool = [diveMainImage, beurreMainImage];
const bootstrapImagePool = fallbackPool;

let container = null;
let isActive = false;
const activeImages = [];
const imageTimers = new Map();
const recentImages = [];
const preloadedTrailImages = new Set();
let listenersAttached = false;
let canRunTrail = true;
let isCoarsePointer = false;
let touchHint = null;
let lastSpawnTime = 0;
let lastPointerX = null;
let lastPointerY = null;
let lastSpawnX = null;
let lastSpawnY = null;
let directionX = 1;
let directionY = 0;
let hasWarmedImagePool = false;

const SPAWN_INTERVAL_DESKTOP = 20;
const SPAWN_INTERVAL_MOBILE = 50;
const MAX_IMAGES_DESKTOP = 22;
const MAX_IMAGES_MOBILE = 16;
const RECENT_HISTORY_SIZE = 10;
const HOLD_DURATION_MS = 380;
const FADE_DURATION_MS = 220;
const MIN_SPAWN_DISTANCE_DESKTOP_PX = 12;
const MIN_SPAWN_DISTANCE_MOBILE_PX = 20;
const SPAWN_FORWARD_OFFSET_DESKTOP_PX = 26;
const SPAWN_FORWARD_OFFSET_MOBILE_PX = 30;
const DIRECTION_SMOOTHING = 0.35;
let hasTrailLaunched = false;

function getTrailSizing() {
  if (!isCoarsePointer) {
    return {
      baseSize: 220,
      randomScale: 0.95 + Math.random() * 0.45,
      spawnInterval: SPAWN_INTERVAL_DESKTOP,
      maxImages: MAX_IMAGES_DESKTOP,
    };
  }

  const viewportShortSide = Math.min(window.innerWidth, window.innerHeight);
  const mobileBaseSize = Math.min(
    Math.max(viewportShortSide * 0.42, 150),
    205
  ) * 0.8;

  return {
    baseSize: mobileBaseSize,
    randomScale: 0.95 + Math.random() * 0.32,
    spawnInterval: SPAWN_INTERVAL_MOBILE,
    maxImages: MAX_IMAGES_MOBILE,
  };
}

function getRandomImage() {
  const basePool = imagePool.length ? imagePool : fallbackPool;
  const loadedPool = basePool.filter((imageSrc) => preloadedTrailImages.has(imageSrc));
  const sourcePool = loadedPool.length > 0 ? loadedPool : bootstrapImagePool;
  const availableImages = sourcePool.filter((imageSrc) => !recentImages.includes(imageSrc));
  const pool = availableImages.length > 0 ? availableImages : sourcePool;
  const randomImage = pool[Math.floor(Math.random() * pool.length)];
  recentImages.push(randomImage);
  if (recentImages.length > RECENT_HISTORY_SIZE) {
    recentImages.shift();
  }
  return randomImage;
}

function warmTrailImagePool() {
  if (hasWarmedImagePool) return;
  hasWarmedImagePool = true;

  const basePool = imagePool.length ? imagePool : fallbackPool;
  basePool.forEach((src) => {
    const preloadImage = new Image();
    preloadImage.decoding = "async";
    preloadImage.addEventListener(
      "load",
      () => {
        preloadedTrailImages.add(src);
      },
      { once: true }
    );
    preloadImage.src = src;
    if (typeof preloadImage.decode === "function") {
      preloadImage
        .decode()
        .then(() => {
          preloadedTrailImages.add(src);
        })
        .catch(() => {});
    }
    if (preloadImage.complete && preloadImage.naturalWidth > 0) {
      preloadedTrailImages.add(src);
    }
  });
}

function clearImageTimers(image) {
  const timers = imageTimers.get(image);
  if (!timers) return;
  timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
  imageTimers.delete(image);
}

function removeImage(image) {
  if (!image) return;
  clearImageTimers(image);
  if (image.parentNode) {
    image.remove();
  }
  const index = activeImages.indexOf(image);
  if (index > -1) {
    activeImages.splice(index, 1);
  }
}

function createTrailImage(x, y) {
  if (!container) return;
  if (!hasTrailLaunched) {
    hasTrailLaunched = true;
    syncTouchHintVisibility();
  }
  const { baseSize, randomScale, maxImages } = getTrailSizing();
  const image = document.createElement("img");
  image.className = "trail-image";
  image.src = getRandomImage();
  image.decoding = "async";
  image.loading = "eager";
  image.fetchPriority = "high";
  image.draggable = false;

  const rotation = (Math.random() - 0.5) * 8;

  image.style.left = `${x}px`;
  image.style.top = `${y}px`;
  image.style.width = `${baseSize * randomScale}px`;
  image.style.height = "auto";
  image.style.setProperty("--rotation", `${rotation}deg`);

  container.append(image);
  activeImages.push(image);

  if (activeImages.length > maxImages) {
    removeImage(activeImages[0]);
  }

  const fadeTimeoutId = window.setTimeout(() => {
    image.classList.add("fade-out");
    const removeTimeoutId = window.setTimeout(() => {
      removeImage(image);
    }, FADE_DURATION_MS);
    imageTimers.set(image, [fadeTimeoutId, removeTimeoutId]);
  }, HOLD_DURATION_MS);

  imageTimers.set(image, [fadeTimeoutId]);
}

function handleMove(x, y) {
  if (!isActive || !canRunTrail) return;
  const { spawnInterval } = getTrailSizing();
  const minSpawnDistance = isCoarsePointer
    ? MIN_SPAWN_DISTANCE_MOBILE_PX
    : MIN_SPAWN_DISTANCE_DESKTOP_PX;
  const spawnOffset = isCoarsePointer
    ? SPAWN_FORWARD_OFFSET_MOBILE_PX
    : SPAWN_FORWARD_OFFSET_DESKTOP_PX;

  if (lastPointerX !== null && lastPointerY !== null) {
    const pointerDeltaX = x - lastPointerX;
    const pointerDeltaY = y - lastPointerY;
    const pointerDeltaLength = Math.hypot(pointerDeltaX, pointerDeltaY);
    if (pointerDeltaLength > 0.001) {
      const targetDirectionX = pointerDeltaX / pointerDeltaLength;
      const targetDirectionY = pointerDeltaY / pointerDeltaLength;
      directionX =
        directionX * (1 - DIRECTION_SMOOTHING) +
        targetDirectionX * DIRECTION_SMOOTHING;
      directionY =
        directionY * (1 - DIRECTION_SMOOTHING) +
        targetDirectionY * DIRECTION_SMOOTHING;
      const directionLength = Math.hypot(directionX, directionY) || 1;
      directionX /= directionLength;
      directionY /= directionLength;
    }
  }
  lastPointerX = x;
  lastPointerY = y;

  const spawnX = x + directionX * spawnOffset;
  const spawnY = y + directionY * spawnOffset;
  if (lastSpawnX !== null && lastSpawnY !== null) {
    const spawnDistance = Math.hypot(spawnX - lastSpawnX, spawnY - lastSpawnY);
    if (spawnDistance < minSpawnDistance) return;
  }

  const now = performance.now();
  if (now - lastSpawnTime < spawnInterval) return;
  lastSpawnTime = now;
  lastSpawnX = spawnX;
  lastSpawnY = spawnY;
  createTrailImage(spawnX, spawnY);
}

function onPointerMove(event) {
  if (event.pointerType === "touch" || event.pointerType === "mouse") return;
  handleMove(event.clientX, event.clientY);
}

function onMouseMove(event) {
  handleMove(event.clientX, event.clientY);
}

function onTouchMove(event) {
  const touch = event.touches?.[0];
  if (!touch) return;
  handleMove(touch.clientX, touch.clientY);
}

function attachMoveListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: true });
}

function detachMoveListeners() {
  if (!listenersAttached) return;
  listenersAttached = false;
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("touchmove", onTouchMove);
}

function clearAllImages() {
  while (activeImages.length) {
    removeImage(activeImages[0]);
  }
  lastSpawnTime = 0;
  lastSpawnX = null;
  lastSpawnY = null;
  lastPointerX = null;
  lastPointerY = null;
  directionX = 1;
  directionY = 0;
}

function buildMediaQueryCleanup(queryList, handler) {
  if (!queryList) return () => {};
  if (typeof queryList.addEventListener === "function") {
    queryList.addEventListener("change", handler);
    return () => queryList.removeEventListener("change", handler);
  }
  if (typeof queryList.addListener === "function") {
    queryList.addListener(handler);
    return () => queryList.removeListener(handler);
  }
  return () => {};
}

function ensureTouchHint() {
  if (touchHint || !container) return;
  touchHint = document.createElement("div");
  touchHint.className = "trail-touch-hint";
  touchHint.setAttribute("aria-hidden", "true");

  const pill = document.createElement("span");
  pill.className = "trail-touch-hint-pill";
  pill.textContent = "Drag your finger";

  touchHint.append(pill);
  container.append(touchHint);
}

function syncTouchHintVisibility() {
  if (!touchHint) return;
  const shouldShow =
    isActive && canRunTrail && isCoarsePointer && !hasTrailLaunched;
  touchHint.classList.toggle("is-visible", shouldShow);
}

export function initImageTrail() {
  container = document.createElement("div");
  container.className = "image-trail-container";
  document.body.append(container);
  warmTrailImagePool();
  ensureTouchHint();

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

  const refreshCapability = () => {
    isCoarsePointer = coarsePointerQuery.matches;
    canRunTrail = !reducedMotionQuery.matches;
    if (!canRunTrail) {
      isActive = false;
      detachMoveListeners();
      clearAllImages();
    }
    syncTouchHintVisibility();
  };

  refreshCapability();
  const cleanupReducedMotion = buildMediaQueryCleanup(
    reducedMotionQuery,
    refreshCapability
  );
  const cleanupCoarsePointer = buildMediaQueryCleanup(
    coarsePointerQuery,
    refreshCapability
  );

  return {
    start() {
      refreshCapability();
      if (!canRunTrail) return;
      isActive = true;
      attachMoveListeners();
      syncTouchHintVisibility();
    },

    stop() {
      isActive = false;
      detachMoveListeners();
      clearAllImages();
      syncTouchHintVisibility();
    },

    destroy() {
      this.stop();
      cleanupReducedMotion();
      cleanupCoarsePointer();
      recentImages.length = 0;
      if (container && container.parentNode) {
        container.remove();
      }
      touchHint = null;
      container = null;
    },
  };
}
