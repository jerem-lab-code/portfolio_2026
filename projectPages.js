import { projectCopyById } from "./project-content/index.js";

const threeDImageModules = import.meta.glob(
  "./project_utiliser/3d/**/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);
const visualIdentityImageModules = import.meta.glob(
  "./project_utiliser/visual identity/**/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);
const creativeCodingImageModules = import.meta.glob(
  "./project_utiliser/creative-coding/**/*.{webp,jpg,jpeg,png,avif}",
  { eager: true, import: "default" }
);
const projectImageModules = {
  ...threeDImageModules,
  ...visualIdentityImageModules,
  ...creativeCodingImageModules,
};

const threeDVideoModules = import.meta.glob(
  "./project_utiliser/3d/**/*.{mp4,webm,mov,m4v,ogg,ogv}",
  { eager: true, import: "default" }
);
const visualIdentityVideoModules = import.meta.glob(
  "./project_utiliser/visual identity/**/*.{mp4,webm,mov,m4v,ogg,ogv}",
  { eager: true, import: "default" }
);
const creativeCodingVideoModules = import.meta.glob(
  "./project_utiliser/creative-coding/**/*.{mp4,webm,mov,m4v,ogg,ogv}",
  { eager: true, import: "default" }
);
const projectMediaModules = {
  ...projectImageModules,
  ...threeDVideoModules,
  ...visualIdentityVideoModules,
  ...creativeCodingVideoModules,
};

const threeDLinksModules = import.meta.glob("./project_utiliser/3d/**/liens_externes.txt", {
  eager: true,
  query: "?raw",
  import: "default",
});
const visualIdentityLinksModules = import.meta.glob(
  "./project_utiliser/visual identity/**/liens_externes.txt",
  {
    eager: true,
    query: "?raw",
    import: "default",
  }
);
const creativeCodingLinksModules = import.meta.glob(
  "./project_utiliser/creative-coding/**/liens_externes.txt",
  {
    eager: true,
    query: "?raw",
    import: "default",
  }
);
const projectLinksModules = {
  ...threeDLinksModules,
  ...visualIdentityLinksModules,
  ...creativeCodingLinksModules,
};

const MASONRY_ALIGN_DELAY_MS = 500;
const YOUTUBE_PROGRESS_POLL_MS = 200;
let masonryResizeRafId = null;

const DEFAULT_PROJECT_LAYOUT = Object.freeze({
  masonry: Object.freeze({
    fullWidthIndices: [],
    useDefaultPattern: false,
    videoPlacement: "start",
    videoFullWidth: false,
    includeMainImageInGrid: false,
    desktopColumns: 2,
  }),
  otherProjects: Object.freeze({
    count: 3,
  }),
});

const DEFAULT_PROJECT_VIDEO = Object.freeze({
  hidePlayerChrome: false,
  autoplayMuted: false,
  showUnmuteButton: false,
  loop: false,
  preferHighQuality: true,
  aspectRatio: null,
  cropZoom: 1,
  widthScale: 1,
});

function updateMasonryColumnClasses(container) {
  if (!container) return;
  const items = container.querySelectorAll(".project-masonry-item:not(.is-full)");
  if (!items.length) return;

  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.left + containerRect.width / 2;

  items.forEach((item) => {
    if (item.classList.contains("is-forced-column")) return;
    const rect = item.getBoundingClientRect();
    if (rect.width === 0) return; // Not visible yet
    const itemCenterX = rect.left + rect.width / 2;
    if (itemCenterX < centerX - 10) {
      item.classList.add("is-left");
      item.classList.remove("is-right");
    } else if (itemCenterX > centerX + 10) {
      item.classList.add("is-right");
      item.classList.remove("is-left");
    } else {
      item.classList.remove("is-left", "is-right");
    }
  });
}

function updateActiveMasonryColumnClasses() {
  const activeMasonry = document.querySelector(".project-masonry");
  if (activeMasonry && window.getComputedStyle(activeMasonry).display !== "none") {
    updateMasonryColumnClasses(activeMasonry);
  }
}

window.addEventListener(
  "resize",
  () => {
    if (masonryResizeRafId) return;
    masonryResizeRafId = window.requestAnimationFrame(() => {
      masonryResizeRafId = null;
      updateActiveMasonryColumnClasses();
    });
  },
  { passive: true }
);

function parseExternalLinks(rawContent) {
  if (!rawContent) return [];
  return rawContent
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line));
}

function appendMarkdownItalicText(targetElement, sourceText) {
  targetElement.textContent = "";
  if (typeof sourceText !== "string" || !sourceText) return;

  const fragment = document.createDocumentFragment();
  const italicPattern = /(\*[^*\n]+\*|_[^_\n]+_)/g;
  let lastIndex = 0;
  let match = italicPattern.exec(sourceText);

  while (match) {
    const token = match[0];
    const tokenStart = match.index;
    if (tokenStart > lastIndex) {
      fragment.append(document.createTextNode(sourceText.slice(lastIndex, tokenStart)));
    }

    const content = token.slice(1, -1);
    const hasEdgeWhitespace = /^\s|\s$/.test(content);
    if (content && !hasEdgeWhitespace) {
      const italicNode = document.createElement("em");
      italicNode.textContent = content;
      fragment.append(italicNode);
    } else {
      fragment.append(document.createTextNode(token));
    }

    lastIndex = tokenStart + token.length;
    match = italicPattern.exec(sourceText);
  }

  if (lastIndex < sourceText.length) {
    fragment.append(document.createTextNode(sourceText.slice(lastIndex)));
  }

  targetElement.append(fragment);
}

function normalizeProjectPath(projectPath) {
  if (!projectPath) return "";
  return projectPath.startsWith("./") ? projectPath : `./${projectPath}`;
}

function buildExternalLinksByProjectPath() {
  const linksByPath = new Map();
  Object.entries(projectLinksModules).forEach(([filePath, rawContent]) => {
    const projectPath = filePath.replace(/\/liens_externes\.txt$/i, "");
    linksByPath.set(projectPath, parseExternalLinks(rawContent));
  });
  return linksByPath;
}

const externalLinksByProjectPath = buildExternalLinksByProjectPath();

function isPngSource(source) {
  if (typeof source !== "string") return false;
  return /\.png(?:$|[?#])/i.test(source.trim());
}

function isVideoSource(source) {
  if (typeof source !== "string") return false;
  return /\.(mp4|webm|mov|m4v|ogg|ogv)(?:$|[?#])/i.test(source.trim());
}

function preloadImageSource(source) {
  if (typeof source !== "string") return Promise.resolve();
  const normalizedSource = source.trim();
  if (!normalizedSource || isVideoSource(normalizedSource)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    image.decoding = "async";
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    image.src = normalizedSource;
    if (image.complete) finish();
  });
}

function collectProjectImageSourcesForPreload({
  mainImageSrc,
  mediaEntries = [],
  otherProjects = [],
}) {
  const sources = new Set();
  if (typeof mainImageSrc === "string" && mainImageSrc.trim()) {
    sources.add(mainImageSrc.trim());
  }

  mediaEntries.forEach((entry) => {
    const source = typeof entry?.src === "string" ? entry.src.trim() : "";
    if (!source || isVideoSource(source)) return;
    sources.add(source);
  });

  otherProjects.forEach((project) => {
    const source =
      typeof project?.mainImageSrc === "string" ? project.mainImageSrc.trim() : "";
    if (!source || isVideoSource(source)) return;
    sources.add(source);
  });

  return Array.from(sources);
}

function collectProjectImages(projectPath, mainImageSrc, includeMainImageInGrid = false) {
  const normalizedPath = normalizeProjectPath(projectPath);
  const folderPrefix = `${normalizedPath}/`;
  const media = Object.entries(projectMediaModules)
    .filter(([assetPath]) => assetPath.startsWith(folderPrefix))
    .sort(([left], [right]) =>
      left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
    .map(([, assetSrc]) => assetSrc);

  const ordered = [];
  if (mainImageSrc && includeMainImageInGrid) ordered.push(mainImageSrc);

  media.forEach((assetSrc) => {
    if (!ordered.includes(assetSrc)) ordered.push(assetSrc);
  });

  return ordered;
}

function resolveAssetSource(inputSource) {
  if (typeof inputSource !== "string") return null;
  const source = inputSource.trim();
  if (!source) return null;

  if (
    /^(https?:)?\/\//i.test(source) ||
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return source;
  }

  const candidates = new Set();
  if (source.startsWith("./")) {
    candidates.add(source);
  } else if (source.startsWith("/")) {
    candidates.add(`.${source}`);
  } else {
    candidates.add(`./${source}`);
  }

  for (const candidate of candidates) {
    if (projectMediaModules[candidate]) return projectMediaModules[candidate];
  }

  return null;
}

function findYoutubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url).trim());
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
    } else if (
      host.endsWith("youtube.com") ||
      host.endsWith("youtube-nocookie.com")
    ) {
      if (parsed.pathname === "/watch") {
        videoId =
          parsed.searchParams.get("v") ||
          parsed.searchParams.get("vi") ||
          "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] || "";
      } else if (parsed.pathname.startsWith("/live/")) {
        videoId = parsed.pathname.split("/")[2] || "";
      }
    }

    const normalizedId = videoId.trim().match(/^[A-Za-z0-9_-]{11}$/)?.[0] || null;
    return normalizedId;
  } catch {
    return null;
  }
}

function buildYoutubeEmbedUrl(videoId, videoConfig = {}) {
  if (!videoId) return null;

  const searchParams = new URLSearchParams();
  searchParams.set("playsinline", "1");
  searchParams.set("fs", "1");
  searchParams.set("rel", "0");
  if (videoConfig.preferHighQuality !== false) {
    searchParams.set("vq", "highres");
  }

  if (videoConfig.loop) {
    searchParams.set("loop", "1");
    searchParams.set("playlist", videoId);
  }

  if (videoConfig.autoplayMuted) {
    searchParams.set("autoplay", "1");
    searchParams.set("mute", "1");
  }

  if (videoConfig.hidePlayerChrome) {
    searchParams.set("controls", "0");
    searchParams.set("modestbranding", "1");
    searchParams.set("iv_load_policy", "3");
    searchParams.set("disablekb", "1");
  } else {
    searchParams.set("controls", "1");
  }

  if (videoConfig.showUnmuteButton || videoConfig.preferHighQuality) {
    searchParams.set("enablejsapi", "1");
    const origin = window.location.origin;
    if (origin && origin !== "null") {
      searchParams.set("origin", origin);
    }
  }

  return `https://www.youtube.com/embed/${videoId}?${searchParams.toString()}`;
}

function pickOtherProjects(project, allProjects, count = 3) {
  if (!Array.isArray(allProjects)) return [];

  return allProjects
    .filter((candidate) => candidate.id && candidate.id !== project.id)
    .sort((left, right) => {
      const leftPriority = left.categoryId === project.categoryId ? 0 : 1;
      const rightPriority = right.categoryId === project.categoryId ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.label.localeCompare(right.label, undefined, {
        sensitivity: "base",
      });
    })
    .slice(0, Math.max(1, count));
}

function resolveSnippetEntryFile(entryFile) {
  if (typeof entryFile !== "string") return "index.html";
  const normalizedEntry = entryFile.trim();
  if (!normalizedEntry) return "index.html";
  return /\.html?(?:$|[?#])/i.test(normalizedEntry)
    ? normalizedEntry
    : "index.html";
}

function shouldAutoLoadSnippetPreview() {
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const saveDataEnabled = Boolean(navigator.connection?.saveData);
  return !isCoarsePointer && !isSmallViewport && !prefersReducedMotion && !saveDataEnabled;
}

function createSnippetIframe(projectPath, title, entryFile = "index.html") {
  const normalizedEntryFile = resolveSnippetEntryFile(entryFile);
  const iframe = document.createElement("iframe");
  iframe.src = projectPath ? `${projectPath}/${normalizedEntryFile}` : "";
  iframe.className = "project-snippet-iframe";
  iframe.setAttribute("title", title);
  iframe.setAttribute(
    "allow",
    "autoplay; fullscreen; xr-spatial-tracking; gamepad; gyroscope; accelerometer"
  );
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

function createSnippetPreview({
  label,
  placeholderSrc,
  projectPath,
  entryFile,
  title,
  autoLoad,
}) {
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const container = document.createElement("div");
  container.className = "project-snippet-container";

  if (placeholderSrc) {
    const placeholder = document.createElement("img");
    placeholder.src = placeholderSrc;
    placeholder.className = "project-snippet-placeholder";
    placeholder.alt = `${label} snippet placeholder`;
    placeholder.loading = "lazy";
    placeholder.decoding = "async";

    const applyPlaceholderRatio = () => {
      if (!placeholder.naturalWidth || !placeholder.naturalHeight) return;
      container.style.setProperty(
        "--snippet-ratio",
        `${placeholder.naturalWidth} / ${placeholder.naturalHeight}`
      );
    };
    if (placeholder.complete) {
      applyPlaceholderRatio();
    } else {
      placeholder.addEventListener("load", applyPlaceholderRatio, { once: true });
    }

    container.append(placeholder);
  }

  const startButton = document.createElement("button");
  startButton.className = "snippet-start-button";
  startButton.type = "button";
  startButton.setAttribute("aria-label", "Start interactive experience");
  const startLabel = isCoarsePointer ? "Tap to Start" : "Start Experience";
  startButton.innerHTML =
    `<span class="snippet-start-button-icon" aria-hidden="true">&#9658;</span><span>${startLabel}</span>`;
  container.append(startButton);

  const loader = document.createElement("div");
  loader.className = "snippet-loader";
  loader.textContent = "Loading interactive view...";
  container.append(loader);

  const unmuteButton = document.createElement("button");
  unmuteButton.type = "button";
  unmuteButton.className = "project-video-unmute";
  unmuteButton.disabled = true;
  unmuteButton.setAttribute("aria-disabled", "true");
  updateVolumeButtonState(unmuteButton, true);
  container.append(unmuteButton);

  let iframe = null;

  const loadSnippet = () => {
    if (iframe) return;
    startButton.classList.add("is-hidden");
    loader.classList.add("is-visible");
    container.classList.add("is-loading");

    iframe = createSnippetIframe(projectPath, title, entryFile);
    iframe.loading = autoLoad ? "lazy" : "eager";
    iframe.addEventListener(
      "load",
      () => {
        container.classList.remove("is-loading");
        container.classList.add("is-active");
        iframe.classList.add("is-ready");
        loader.classList.remove("is-visible");
        unmuteButton.disabled = false;
        unmuteButton.removeAttribute("aria-disabled");
        window.setTimeout(() => loader.remove(), 220);
      },
      { once: true }
    );

    container.append(iframe);
  };

  startButton.addEventListener("click", loadSnippet);

  unmuteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!iframe) return;
    const isMuted = unmuteButton.dataset.muted !== "false";
    const newState = !isMuted;
    updateVolumeButtonState(unmuteButton, newState);
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "toggle-sound", muted: newState }, "*");
    }
  });

  if (autoLoad) {
    window.requestAnimationFrame(loadSnippet);
  }

  return container;
}

function createImageMasonryItem(mediaEntry, label, index, isFullWidth) {
  const figure = document.createElement("figure");
  figure.className = "project-masonry-item";
  if (mediaEntry.column === "left" || mediaEntry.column === "right") {
    figure.dataset.masonryColumn = mediaEntry.column;
    figure.classList.add("is-forced-column", mediaEntry.column === "left" ? "is-left" : "is-right");
  }
  if (isFullWidth) {
    figure.classList.add("is-full");
  }

  if (mediaEntry.type === "snippet") {
    const snippet = createSnippetPreview({
      label,
      placeholderSrc: mediaEntry.src,
      projectPath: mediaEntry.projectPath,
      entryFile: mediaEntry.entry,
      title: `${label} interactive snippet`,
      autoLoad: shouldAutoLoadSnippetPreview(),
    });
    figure.append(snippet);

    return figure;
  }

  if (isVideoSource(mediaEntry.src)) {
    // figure.classList.add("project-masonry-video"); // Removed to allow natural sizing
    const video = document.createElement("video");
    video.src = mediaEntry.src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("aria-label", mediaEntry.alt || `${label} video ${index + 1}`);

    if (mediaEntry.className) {
      video.classList.add(mediaEntry.className);
    }
    if (mediaEntry.style) {
      video.setAttribute("style", mediaEntry.style);
    }

    video.addEventListener("loadedmetadata", () => {
      if (!video.videoWidth || !video.videoHeight) return;
      const ratio = video.videoHeight / video.videoWidth;
      figure.classList.toggle("is-portrait", ratio > 1.05);
      figure.classList.toggle("is-very-tall", ratio > 1.45);
    });

    figure.append(video);

    if (mediaEntry.showUnmuteButton !== false) {
      // Add unmute button for local videos
      const unmuteButton = document.createElement("button");
      unmuteButton.type = "button";
      unmuteButton.className = "project-video-unmute";
      updateVolumeButtonState(unmuteButton, true);
      unmuteButton.addEventListener("click", () => {
        const isMuted = unmuteButton.dataset.muted !== "false";
        if (isMuted) {
          video.muted = false;
          updateVolumeButtonState(unmuteButton, false);
        } else {
          video.muted = true;
          updateVolumeButtonState(unmuteButton, true);
        }
      });
      figure.append(unmuteButton);
    }
  } else {
    if (isPngSource(mediaEntry.src)) {
      figure.classList.add("is-png");
    }

    const image = document.createElement("img");
    image.src = mediaEntry.src;
    image.loading = "eager";
    image.decoding = "async";
    image.fetchPriority = index < 3 ? "high" : "auto";
    image.alt = mediaEntry.alt || `${label} visual ${index + 1}`;

    if (mediaEntry.className) {
      image.classList.add(mediaEntry.className);
    }

    const syncOrientationClass = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const ratio = image.naturalHeight / image.naturalWidth;
      figure.classList.toggle("is-portrait", ratio > 1.05);
      figure.classList.toggle("is-very-tall", ratio > 1.45);
    };
    if (image.complete) {
      syncOrientationClass();
    } else {
      image.addEventListener("load", syncOrientationClass, { once: true });
    }

    if (mediaEntry.href) {
      const link = document.createElement("a");
      link.className = "project-masonry-link";
      link.href = mediaEntry.href;
      if (mediaEntry.newTab !== false) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      link.append(image);
      figure.append(link);
    } else {
      figure.append(image);
    }
  }

  return figure;
}

function sendYoutubePlayerCommand(iframe, command, args = []) {
  if (!iframe?.contentWindow || !command) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args: Array.isArray(args) ? args : [args],
    }),
    "*"
  );
}

function requestBestYoutubeQuality(iframe) {
  sendYoutubePlayerCommand(iframe, "setPlaybackQualityRange", ["highres"]);
  sendYoutubePlayerCommand(iframe, "setPlaybackQuality", ["highres"]);
}

function createVolumeIcon(isMuted) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const speakerPath = document.createElementNS(svgNamespace, "path");
  speakerPath.setAttribute("d", "M11 5 6 9H3v6h3l5 4V5z");
  speakerPath.setAttribute("fill", "none");
  speakerPath.setAttribute("stroke", "currentColor");
  speakerPath.setAttribute("stroke-width", "1.8");
  speakerPath.setAttribute("stroke-linejoin", "round");
  speakerPath.setAttribute("stroke-linecap", "round");
  svg.append(speakerPath);

  if (isMuted) {
    const crossOne = document.createElementNS(svgNamespace, "path");
    crossOne.setAttribute("d", "M16 9l5 6");
    crossOne.setAttribute("fill", "none");
    crossOne.setAttribute("stroke", "currentColor");
    crossOne.setAttribute("stroke-width", "1.8");
    crossOne.setAttribute("stroke-linecap", "round");
    svg.append(crossOne);

    const crossTwo = document.createElementNS(svgNamespace, "path");
    crossTwo.setAttribute("d", "M21 9l-5 6");
    crossTwo.setAttribute("fill", "none");
    crossTwo.setAttribute("stroke", "currentColor");
    crossTwo.setAttribute("stroke-width", "1.8");
    crossTwo.setAttribute("stroke-linecap", "round");
    svg.append(crossTwo);
  } else {
    const waveInner = document.createElementNS(svgNamespace, "path");
    waveInner.setAttribute("d", "M16.5 9a4.5 4.5 0 0 1 0 6");
    waveInner.setAttribute("fill", "none");
    waveInner.setAttribute("stroke", "currentColor");
    waveInner.setAttribute("stroke-width", "1.8");
    waveInner.setAttribute("stroke-linecap", "round");
    svg.append(waveInner);

    const waveOuter = document.createElementNS(svgNamespace, "path");
    waveOuter.setAttribute("d", "M19 6.5a8 8 0 0 1 0 11");
    waveOuter.setAttribute("fill", "none");
    waveOuter.setAttribute("stroke", "currentColor");
    waveOuter.setAttribute("stroke-width", "1.8");
    waveOuter.setAttribute("stroke-linecap", "round");
    svg.append(waveOuter);
  }

  return svg;
}

function updateVolumeButtonState(button, isMuted) {
  button.dataset.muted = isMuted ? "true" : "false";
  button.setAttribute("aria-label", isMuted ? "Unmute video" : "Mute video");
  button.title = isMuted ? "Unmute" : "Mute";
  button.replaceChildren(createVolumeIcon(isMuted));
}

function parseAspectRatio(aspectRatio) {
  if (typeof aspectRatio !== "string") return null;
  const match = aspectRatio.match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)\s*$/);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height) return null;
  return width / height;
}

function createYoutubeMasonryItem(
  embedUrl,
  isFullWidth,
  videoConfig = {},
  registerCleanup = null
) {
  const registerVideoCleanup =
    typeof registerCleanup === "function" ? registerCleanup : () => {};
  const figure = document.createElement("figure");
  figure.className = `project-masonry-item project-masonry-video${isFullWidth ? " is-full" : ""}`;
  if (videoConfig.hidePlayerChrome) {
    figure.classList.add("is-cinematic");
  }
  if (typeof videoConfig.aspectRatio === "string" && videoConfig.aspectRatio.trim()) {
    figure.style.setProperty(
      "--project-video-aspect-ratio",
      videoConfig.aspectRatio.trim()
    );
    const numericRatio = parseAspectRatio(videoConfig.aspectRatio);
    if (numericRatio) {
      figure.style.setProperty("--project-video-ratio", String(numericRatio));
    }
  }
  if (
    typeof videoConfig.cropZoom === "number" &&
    Number.isFinite(videoConfig.cropZoom) &&
    videoConfig.cropZoom > 1
  ) {
    figure.style.setProperty("--project-video-zoom", String(videoConfig.cropZoom));
  }
  if (
    typeof videoConfig.widthScale === "number" &&
    Number.isFinite(videoConfig.widthScale) &&
    videoConfig.widthScale > 0 &&
    videoConfig.widthScale < 1
  ) {
    figure.style.setProperty(
      "--project-video-width-scale",
      String(videoConfig.widthScale)
    );
  }

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.title = "Project video";
  iframe.loading = "eager";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  figure.append(iframe);

  if (videoConfig.preferHighQuality) {
    iframe.addEventListener("load", () => {
      window.setTimeout(() => requestBestYoutubeQuality(iframe), 220);
      window.setTimeout(() => requestBestYoutubeQuality(iframe), 1100);
    });
  }

  if (videoConfig.showUnmuteButton) {
    const unmuteButton = document.createElement("button");
    unmuteButton.type = "button";
    unmuteButton.className = "project-video-unmute";
    updateVolumeButtonState(unmuteButton, true);
    unmuteButton.addEventListener("click", () => {
      const isMuted = unmuteButton.dataset.muted !== "false";
      if (isMuted) {
        sendYoutubePlayerCommand(iframe, "unMute");
        sendYoutubePlayerCommand(iframe, "playVideo");
        updateVolumeButtonState(unmuteButton, false);
      } else {
        sendYoutubePlayerCommand(iframe, "mute");
        updateVolumeButtonState(unmuteButton, true);
      }
    });
    figure.append(unmuteButton);
  }

  if (videoConfig.customControls) {
    const controls = document.createElement("div");
    controls.className = "project-video-controls";

    const timelineContainer = document.createElement("div");
    timelineContainer.className = "project-video-timeline-container";

    const timeline = document.createElement("div");
    timeline.className = "project-video-timeline";

    const progress = document.createElement("div");
    progress.className = "project-video-progress";

    timeline.append(progress);
    timelineContainer.append(timeline);

    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.className = "project-video-fullscreen-btn";
    fullscreenBtn.type = "button";
    fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;

    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        figure
          .requestFullscreen()
          .catch((err) => console.warn("Fullscreen failed", err));
      } else {
        document.exitFullscreen();
      }
    });

    controls.append(timelineContainer, fullscreenBtn);
    figure.append(controls);

    let player = null;
    let isDragging = false;
    let progressTimerId = null;
    let controlsBound = false;

    const clearProgressTimer = () => {
      if (!progressTimerId) return;
      window.clearInterval(progressTimerId);
      progressTimerId = null;
    };

    const updateProgressFromPointer = (event) => {
      if (!player || typeof event.clientX !== "number") return;
      const rect = timeline.getBoundingClientRect();
      if (!rect.width) return;
      let x = event.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percent = x / rect.width;
      const duration = player.getDuration();
      if (!duration) return;
      player.seekTo(duration * percent, true);
      progress.style.width = `${percent * 100}%`;
    };

    const handlePointerDown = (event) => {
      isDragging = true;
      updateProgressFromPointer(event);
    };

    const handlePointerMove = (event) => {
      if (!isDragging) return;
      updateProgressFromPointer(event);
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const attachControls = () => {
      if (controlsBound) return;
      controlsBound = true;

      timelineContainer.addEventListener("click", updateProgressFromPointer);
      timelineContainer.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      progressTimerId = window.setInterval(() => {
        if (!player || isDragging || typeof player.getCurrentTime !== "function") {
          return;
        }
        const current = player.getCurrentTime();
        const total = player.getDuration();
        if (total > 0) {
          progress.style.width = `${(current / total) * 100}%`;
        }
      }, YOUTUBE_PROGRESS_POLL_MS);
    };

    const detachControls = () => {
      if (!controlsBound) return;
      controlsBound = false;
      timelineContainer.removeEventListener("click", updateProgressFromPointer);
      timelineContainer.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      clearProgressTimer();
    };

    registerVideoCleanup(() => {
      detachControls();
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
      player = null;
    });

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (!iframe.id) {
        iframe.id = `yt-player-${Math.random().toString(36).slice(2, 11)}`;
      }

      player = new window.YT.Player(iframe.id, {
        events: {
          onReady: () => {
            attachControls();
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED && videoConfig.loop) {
              player.playVideo();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!window.ytApiCallbacks) window.ytApiCallbacks = [];
      window.ytApiCallbacks.push(initPlayer);
      registerVideoCleanup(() => {
        if (!Array.isArray(window.ytApiCallbacks)) return;
        window.ytApiCallbacks = window.ytApiCallbacks.filter(
          (callback) => callback !== initPlayer
        );
      });

      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          window.ytApiCallbacks.forEach((callback) => callback());
          window.ytApiCallbacks = [];
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          document.head.append(tag);
        }
      }
    }
  }

  return figure;
}

function appendMasonryNodes(container, mediaNodes, requestedColumnCount = 2) {
  if (!container || !Array.isArray(mediaNodes) || !mediaNodes.length) return;
  const normalizedRequestedColumns =
    Number.isInteger(requestedColumnCount) && requestedColumnCount > 0
      ? requestedColumnCount
      : 2;

  const appendColumnGroup = (nodes) => {
    if (!nodes.length) return;
    const columnCount = Math.max(1, Math.min(normalizedRequestedColumns, nodes.length));
    const columnGroup = document.createElement("div");
    columnGroup.className = "project-masonry-columns";
    columnGroup.style.setProperty("--masonry-columns", String(columnCount));

    const columns = Array.from({ length: columnCount }, () => {
      const column = document.createElement("div");
      column.className = "project-masonry-column";
      columnGroup.append(column);
      return column;
    });

    let autoColumnIndex = 0;
    nodes.forEach((node) => {
      const forcedColumn = node.dataset.masonryColumn;
      if (forcedColumn === "left") {
        columns[0].append(node);
        return;
      }
      if (forcedColumn === "right" && columnCount > 1) {
        columns[columnCount - 1].append(node);
        return;
      }
      columns[autoColumnIndex % columnCount].append(node);
      autoColumnIndex += 1;
    });

    container.append(columnGroup);
  };

  let pendingColumnNodes = [];
  const flushColumnGroup = () => {
    appendColumnGroup(pendingColumnNodes);
    pendingColumnNodes = [];
  };

  mediaNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    if (node.classList.contains("is-full")) {
      flushColumnGroup();
      const fullWidthRow = document.createElement("div");
      fullWidthRow.className = "project-masonry-full-row";
      fullWidthRow.append(node);
      container.append(fullWidthRow);
      return;
    }

    pendingColumnNodes.push(node);
  });

  flushColumnGroup();
}

function normalizeProjectLayout(layoutConfig) {
  const masonryConfig =
    layoutConfig && typeof layoutConfig.masonry === "object" ? layoutConfig.masonry : {};
  const otherProjectsConfig =
    layoutConfig && typeof layoutConfig.otherProjects === "object"
      ? layoutConfig.otherProjects
      : {};

  const videoPlacement = masonryConfig.videoPlacement;
  const normalizedVideoPlacement =
    Number.isInteger(videoPlacement) && videoPlacement >= 0
      ? videoPlacement
      : videoPlacement === "end" || videoPlacement === "none" || videoPlacement === "start"
        ? videoPlacement
        : DEFAULT_PROJECT_LAYOUT.masonry.videoPlacement;

  return {
    masonry: {
      fullWidthIndices: Array.isArray(masonryConfig.fullWidthIndices)
        ? masonryConfig.fullWidthIndices.filter(
          (index) => Number.isInteger(index) && index >= 0
        )
        : DEFAULT_PROJECT_LAYOUT.masonry.fullWidthIndices,
      useDefaultPattern:
        typeof masonryConfig.useDefaultPattern === "boolean"
          ? masonryConfig.useDefaultPattern
          : DEFAULT_PROJECT_LAYOUT.masonry.useDefaultPattern,
      videoPlacement: normalizedVideoPlacement,
      videoFullWidth:
        typeof masonryConfig.videoFullWidth === "boolean"
          ? masonryConfig.videoFullWidth
          : DEFAULT_PROJECT_LAYOUT.masonry.videoFullWidth,
      includeMainImageInGrid:
        typeof masonryConfig.includeMainImageInGrid === "boolean"
          ? masonryConfig.includeMainImageInGrid
          : DEFAULT_PROJECT_LAYOUT.masonry.includeMainImageInGrid,
      desktopColumns:
        Number.isInteger(masonryConfig.desktopColumns) && masonryConfig.desktopColumns > 0
          ? masonryConfig.desktopColumns
          : DEFAULT_PROJECT_LAYOUT.masonry.desktopColumns,
    },
    otherProjects: {
      count:
        Number.isInteger(otherProjectsConfig.count) && otherProjectsConfig.count > 0
          ? otherProjectsConfig.count
          : DEFAULT_PROJECT_LAYOUT.otherProjects.count,
    },
  };
}

function isFullWidthByLayout(index, masonryLayout) {
  if (masonryLayout.fullWidthIndices.includes(index)) return true;
  if (!masonryLayout.useDefaultPattern) return false;
  return index === 0 || (index >= 3 && (index - 3) % 4 === 0);
}

function filterMainImageFromMedia(
  mediaEntries,
  mainImageSrc,
  includeMainImageInGrid
) {
  if (includeMainImageInGrid || !mainImageSrc) return mediaEntries;
  return mediaEntries.filter((entry) => {
    if (entry?.type === "snippet") return true;
    return entry?.src !== mainImageSrc;
  });
}

function resolveMediaEntries(
  projectConfig,
  project,
  fallbackMedia,
  includeMainImageInGrid
) {
  if (!Array.isArray(projectConfig.media) || !projectConfig.media.length) {
    return filterMainImageFromMedia(
      fallbackMedia.map((src, index) => ({
        src,
        alt: `${project.label} visual ${index + 1}`,
      })),
      project.mainImageSrc,
      includeMainImageInGrid
    );
  }

  const normalizedProjectPath = normalizeProjectPath(project.projectPath);
  const configuredMedia = projectConfig.media
    .map((mediaConfig, index) => {
      const normalizedConfig =
        typeof mediaConfig === "string"
          ? { src: mediaConfig }
          : mediaConfig && typeof mediaConfig === "object"
            ? mediaConfig
            : null;

      if (!normalizedConfig?.src) return null;

      let resolvedSrc = resolveAssetSource(normalizedConfig.src);
      if (!resolvedSrc && !String(normalizedConfig.src).includes("/")) {
        resolvedSrc = resolveAssetSource(`${normalizedProjectPath}/${normalizedConfig.src}`);
      }
      if (!resolvedSrc) return null;

      return {
        src: resolvedSrc,
        alt:
          typeof normalizedConfig.alt === "string" && normalizedConfig.alt.trim()
            ? normalizedConfig.alt.trim()
            : `${project.label} visual ${index + 1}`,
        href:
          typeof normalizedConfig.href === "string" && normalizedConfig.href.trim()
            ? normalizedConfig.href.trim()
            : null,
        newTab:
          typeof normalizedConfig.newTab === "boolean"
            ? normalizedConfig.newTab
            : undefined,
        className:
          typeof normalizedConfig.className === "string"
            ? normalizedConfig.className
            : undefined,
        column:
          normalizedConfig.column === "left" || normalizedConfig.column === "right"
            ? normalizedConfig.column
            : undefined,
        fullWidth:
          typeof normalizedConfig.fullWidth === "boolean"
            ? normalizedConfig.fullWidth
            : undefined,
        showUnmuteButton:
          typeof normalizedConfig.showUnmuteButton === "boolean"
            ? normalizedConfig.showUnmuteButton
            : undefined,
        type: normalizedConfig.type,
        entry: normalizedConfig.entry,
        style: normalizedConfig.style,
        projectPath: normalizedProjectPath,
      };
    })
    .filter(Boolean);

  if (configuredMedia.length) {
    return filterMainImageFromMedia(
      configuredMedia,
      project.mainImageSrc,
      includeMainImageInGrid
    );
  }

  return filterMainImageFromMedia(
    fallbackMedia.map((src, index) => ({
      src,
      alt: `${project.label} visual ${index + 1}`,
    })),
    project.mainImageSrc,
    includeMainImageInGrid
  );
}

function resolveProjectConfig(project, linksFromFiles) {
  const customConfig = projectCopyById[project.id] || {};
  const hasExternalLinks = Object.prototype.hasOwnProperty.call(
    customConfig,
    "externalLinks"
  );
  const externalLinks = hasExternalLinks ? customConfig.externalLinks || [] : linksFromFiles;
  const customVideoConfig =
    customConfig.video && typeof customConfig.video === "object"
      ? customConfig.video
      : {};

  return {
    description:
      customConfig.description ||
      `${project.label} est presente ici sous forme de page projet avec un hero, une galerie masonry et une section de navigation vers d'autres travaux.`,
    collaboration:
      customConfig.collaboration ||
      "Collaboration: information non renseignee pour le moment.",
    externalLinks,
    media: Array.isArray(customConfig.media) ? customConfig.media : null,
    layout: normalizeProjectLayout(customConfig.layout),
    video: {
      hidePlayerChrome:
        typeof customVideoConfig.hidePlayerChrome === "boolean"
          ? customVideoConfig.hidePlayerChrome
          : DEFAULT_PROJECT_VIDEO.hidePlayerChrome,
      autoplayMuted:
        typeof customVideoConfig.autoplayMuted === "boolean"
          ? customVideoConfig.autoplayMuted
          : DEFAULT_PROJECT_VIDEO.autoplayMuted,
      showUnmuteButton:
        typeof customVideoConfig.showUnmuteButton === "boolean"
          ? customVideoConfig.showUnmuteButton
          : DEFAULT_PROJECT_VIDEO.showUnmuteButton,
      loop:
        typeof customVideoConfig.loop === "boolean"
          ? customVideoConfig.loop
          : DEFAULT_PROJECT_VIDEO.loop,
      preferHighQuality:
        typeof customVideoConfig.preferHighQuality === "boolean"
          ? customVideoConfig.preferHighQuality
          : DEFAULT_PROJECT_VIDEO.preferHighQuality,
      aspectRatio:
        typeof customVideoConfig.aspectRatio === "string" &&
          customVideoConfig.aspectRatio.trim()
          ? customVideoConfig.aspectRatio.trim()
          : DEFAULT_PROJECT_VIDEO.aspectRatio,
      cropZoom:
        typeof customVideoConfig.cropZoom === "number" &&
          Number.isFinite(customVideoConfig.cropZoom) &&
          customVideoConfig.cropZoom > 0
          ? customVideoConfig.cropZoom
          : DEFAULT_PROJECT_VIDEO.cropZoom,
      widthScale:
        typeof customVideoConfig.widthScale === "number" &&
          Number.isFinite(customVideoConfig.widthScale) &&
          customVideoConfig.widthScale > 0
          ? customVideoConfig.widthScale
          : DEFAULT_PROJECT_VIDEO.widthScale,
    },
    mainImage: customConfig.mainImage || null,
  };
}

function createProjectViewRoot() {
  const article = document.createElement("article");
  article.className = "project-view";
  article.id = "project-view";
  article.setAttribute("aria-hidden", "true");
  return article;
}

function createProjectLoadingState(projectLabel) {
  const loading = document.createElement("div");
  loading.className = "project-view-loading";
  loading.textContent = `Loading ${projectLabel || "project"}...`;
  return loading;
}

export function initProjectPages({ galleryPanel }) {
  if (!galleryPanel) {
    return {
      closeProject() { },
      getCurrentProject: () => null,
      isOpen: () => false,
      openProject() { },
    };
  }

  const pageBody = document.body;
  const projectViewRoot = createProjectViewRoot();
  galleryPanel.append(projectViewRoot);

  let currentProject = null;
  let activeRenderRequestId = 0;
  const projectCleanupTasks = new Set();

  function registerProjectCleanup(task) {
    if (typeof task !== "function") return;
    projectCleanupTasks.add(task);
  }

  function runProjectCleanup() {
    projectCleanupTasks.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.warn("Project cleanup failed", error);
      }
    });
    projectCleanupTasks.clear();
  }

  async function render(project, renderRequestId) {
    runProjectCleanup();
    const normalizedProjectPath = normalizeProjectPath(project.projectPath);
    const linksFromFiles = externalLinksByProjectPath.get(normalizedProjectPath) || [];
    const projectConfig = resolveProjectConfig(project, linksFromFiles);
    let effectiveMainImageSrc = project.mainImageSrc;
    if (projectConfig.mainImage) {
      let resolvedSrc = resolveAssetSource(projectConfig.mainImage);
      if (!resolvedSrc && !String(projectConfig.mainImage).includes("/")) {
        resolvedSrc = resolveAssetSource(`${normalizedProjectPath}/${projectConfig.mainImage}`);
      }
      if (resolvedSrc) {
        effectiveMainImageSrc = resolvedSrc;
      }
    }

    const media = collectProjectImages(
      normalizedProjectPath,
      effectiveMainImageSrc,
      projectConfig.layout.masonry.includeMainImageInGrid
    );
    const mediaEntries = resolveMediaEntries(
      projectConfig,
      { ...project, mainImageSrc: effectiveMainImageSrc },
      media,
      projectConfig.layout.masonry.includeMainImageInGrid
    );
    const youtubeVideoId = projectConfig.externalLinks
      .map((url) => findYoutubeVideoId(url))
      .find(Boolean);
    const youtubeEmbedUrl = youtubeVideoId
      ? buildYoutubeEmbedUrl(youtubeVideoId, projectConfig.video)
      : null;
    const otherProjects = pickOtherProjects(
      project,
      project.allProjects,
      projectConfig.layout.otherProjects.count
    );
    const imageSourcesToPreload = collectProjectImageSourcesForPreload({
      mainImageSrc: effectiveMainImageSrc,
      mediaEntries,
      otherProjects,
    });
    await Promise.all(imageSourcesToPreload.map((source) => preloadImageSource(source)));

    if (renderRequestId !== activeRenderRequestId || currentProject?.id !== project.id) {
      return;
    }

    const container = document.createElement("div");
    container.className = "project-view-content";

    const hero = document.createElement("header");
    hero.className = "project-hero";

    const title = document.createElement("h2");
    title.className = "project-title";
    title.textContent = project.label;

    const description = document.createElement("p");
    description.className = "project-description";
    appendMarkdownItalicText(description, projectConfig.description);

    const collaboration = document.createElement("p");
    collaboration.className = "project-collaboration";
    appendMarkdownItalicText(collaboration, projectConfig.collaboration);

    hero.append(title, description, collaboration);

    const mainFigure = document.createElement("figure");
    mainFigure.className = "project-main-image";

    // Check if the first media entry is a snippet and should be the hero
    // We check the raw projectConfig.media before filtering
    const firstConfigMedia = projectConfig.media?.[0];
    const hasSnippetHero = firstConfigMedia &&
      (typeof firstConfigMedia === "object") &&
      firstConfigMedia.type === "snippet" &&
      firstConfigMedia.useAsHero !== false;
    const snippetHeroPath = hasSnippetHero ? mediaEntries[0]?.projectPath : null;
    const shouldRenderSnippetHero = Boolean(snippetHeroPath);

    if (shouldRenderSnippetHero) {
      mainFigure.classList.add("has-snippet-hero");
      const heroSnippet = createSnippetPreview({
        label: project.label,
        placeholderSrc: mediaEntries[0]?.src || effectiveMainImageSrc,
        projectPath: snippetHeroPath,
        entryFile: mediaEntries[0]?.entry,
        title: `${project.label} interactive hero snippet`,
        autoLoad: shouldAutoLoadSnippetPreview(),
      });
      heroSnippet.classList.add("is-hero");
      mainFigure.append(heroSnippet);
    } else {
      if (isPngSource(effectiveMainImageSrc)) {
        mainFigure.classList.add("is-png");
      }
      const mainImage = document.createElement("img");
      mainImage.src = effectiveMainImageSrc;
      mainImage.alt = `${project.label} main image`;
      mainImage.fetchPriority = "high"; // Optimize LCP
      mainImage.loading = "eager";
      mainFigure.append(mainImage);
    }

    const intro = document.createElement("section");
    intro.className = "project-intro";
    intro.append(mainFigure, hero);

    const masonrySection = document.createElement("section");
    masonrySection.className = "project-masonry";
    if (projectConfig.layout.masonry.desktopColumns > 2) {
      masonrySection.classList.add(`columns-${projectConfig.layout.masonry.desktopColumns}`);
      masonrySection.style.setProperty(
        "--desktop-columns",
        projectConfig.layout.masonry.desktopColumns
      );
    }
    masonrySection.setAttribute("aria-label", `${project.label} media gallery`);

    const mediaNodes = [];
    if (mediaEntries.length) {
      mediaEntries.forEach((mediaEntry, index) => {
        if (shouldRenderSnippetHero && index === 0) return;

        const isFullWidth =
          typeof mediaEntry.fullWidth === "boolean"
            ? mediaEntry.fullWidth
            : isFullWidthByLayout(index, projectConfig.layout.masonry);
        mediaNodes.push(
          createImageMasonryItem(mediaEntry, project.label, index, isFullWidth)
        );
      });
    }

    if (youtubeEmbedUrl && projectConfig.layout.masonry.videoPlacement !== "none") {
      const videoNode = createYoutubeMasonryItem(
        youtubeEmbedUrl,
        projectConfig.layout.masonry.videoFullWidth,
        projectConfig.video,
        registerProjectCleanup
      );
      const videoPlacement = projectConfig.layout.masonry.videoPlacement;

      if (videoPlacement === "end") {
        mediaNodes.push(videoNode);
      } else if (Number.isInteger(videoPlacement)) {
        const safeIndex = Math.max(0, Math.min(videoPlacement, mediaNodes.length));
        mediaNodes.splice(safeIndex, 0, videoNode);
      } else {
        mediaNodes.unshift(videoNode);
      }
    }
    const getMasonryColumnCount = () =>
      window.matchMedia("(min-width: 1024px)").matches
        ? projectConfig.layout.masonry.desktopColumns
        : 2;

    let masonryColumnCount = null;
    const renderMasonry = () => {
      const nextColumnCount = getMasonryColumnCount();
      if (nextColumnCount === masonryColumnCount && masonrySection.childElementCount > 0) {
        return;
      }

      masonryColumnCount = nextColumnCount;
      masonrySection.replaceChildren();
      appendMasonryNodes(masonrySection, mediaNodes, masonryColumnCount);
      updateMasonryColumnClasses(masonrySection);
    };

    renderMasonry();

    const handleMasonryResize = () => {
      window.requestAnimationFrame(renderMasonry);
    };
    window.addEventListener("resize", handleMasonryResize, { passive: true });
    registerProjectCleanup(() => {
      window.removeEventListener("resize", handleMasonryResize);
    });

    const otherFooter = document.createElement("footer");
    otherFooter.className = "project-other";

    const otherTitle = document.createElement("h3");
    otherTitle.className = "project-other-title";
    otherTitle.textContent = "Other projects";

    const otherGrid = document.createElement("div");
    otherGrid.className = "project-other-grid";

    otherProjects.forEach((otherProject) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "project-other-card";
      if (isPngSource(otherProject.mainImageSrc)) {
        button.classList.add("is-png");
      }
      button.addEventListener("click", () => {
        openProject({ ...otherProject, allProjects: project.allProjects });
      });

      const image = document.createElement("img");
      image.src = otherProject.mainImageSrc;
      image.alt = `${otherProject.label} main image`;
      image.loading = "eager";
      image.decoding = "async";
      image.fetchPriority = "high";

      const label = document.createElement("span");
      label.className = "project-other-label";
      label.textContent = otherProject.label;

      button.append(image, label);
      otherGrid.append(button);
    });

    otherFooter.append(otherTitle, otherGrid);

    container.append(intro, masonrySection, otherFooter);

    projectViewRoot.replaceChildren(container);

    const masonryAlignFrameId = window.requestAnimationFrame(() => {
      updateMasonryColumnClasses(masonrySection);
      const masonryAlignTimeoutId = window.setTimeout(
        () => updateMasonryColumnClasses(masonrySection),
        MASONRY_ALIGN_DELAY_MS
      );
      registerProjectCleanup(() => window.clearTimeout(masonryAlignTimeoutId));
    });
    registerProjectCleanup(() => window.cancelAnimationFrame(masonryAlignFrameId));
  }

  function openProject(project) {
    if (!project?.id) return;

    const projectPayload = {
      ...project,
      allProjects:
        Array.isArray(project.allProjects) && project.allProjects.length
          ? project.allProjects
          : currentProject?.allProjects || [],
    };
    const renderRequestId = ++activeRenderRequestId;

    currentProject = projectPayload;
    pageBody.classList.add("is-project-view");
    projectViewRoot.setAttribute("aria-hidden", "false");
    projectViewRoot.replaceChildren(createProjectLoadingState(projectPayload.label));
    galleryPanel.scrollTo({ top: 0, behavior: "auto" });

    render(projectPayload, renderRequestId).catch((error) => {
      if (renderRequestId !== activeRenderRequestId) return;
      console.error("Failed to render project", error);
    });
  }

  function closeProject() {
    activeRenderRequestId += 1;
    runProjectCleanup();
    if (!currentProject) return;
    currentProject = null;
    pageBody.classList.remove("is-project-view");
    projectViewRoot.setAttribute("aria-hidden", "true");
    projectViewRoot.replaceChildren();
  }

  function isOpen() {
    return Boolean(currentProject);
  }

  function getCurrentProject() {
    return currentProject;
  }

  return {
    closeProject,
    getCurrentProject,
    isOpen,
    openProject,
  };
}
