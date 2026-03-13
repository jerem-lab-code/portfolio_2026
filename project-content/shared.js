const DEFAULT_DESCRIPTION = "Sharme is a 3D commercial project for a cocktail brand conceived to evoke a sense of refreshment and escape. The accompanying video and visuals communicates freshness, warmth, and conviviality, crafting an aspirational atmosphere that celebrates shared moments under the sun.";
const DEFAULT_COLLABORATION =
  " ";

function normalizeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

export function defineProjectContent(config = {}) {
  const {
    id,
    description = DEFAULT_DESCRIPTION,
    collaboration = DEFAULT_COLLABORATION,
    externalLinks = [],
    media = [],
    video,
    layout,
    mainImage,
  } = config;

  if (!id || typeof id !== "string") {
    throw new Error("defineProjectContent requires a string `id`.");
  }

  const projectContent = {
    id,
    description: normalizeText(description, DEFAULT_DESCRIPTION),
    collaboration: normalizeText(collaboration, DEFAULT_COLLABORATION),
    externalLinks: Array.isArray(externalLinks) ? externalLinks : [],
    media: Array.isArray(media) ? media : [],
  };

  if (video && typeof video === "object") {
    projectContent.video = video;
  }

  if (layout && typeof layout === "object") {
    projectContent.layout = layout;
  }

  if (typeof mainImage === "string" && mainImage.trim()) {
    projectContent.mainImage = mainImage.trim();
  }

  return projectContent;
}
