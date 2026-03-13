import { defineProjectContent } from "./shared.js";

const media = [
  { src: "sharme_1.webp" },
  { src: "sharme_2.webp" },
  { src: "sharme_3.webp" },
  { src: "sharme_4.webp" },
];

const video = {
  autoplayMuted: true,
  showUnmuteButton: true,
  customControls: true,
  hidePlayerChrome: true,
  loop: true,
  aspectRatio: "9 / 16",
};

const layout = {
  masonry: {
    includeMainImageInGrid: true,
    videoFullWidth: true,
  },
};

const sharmeProjectContent = defineProjectContent({
  id: "sharme",
  description: "*SHARME* is a 3D advertisement developed for a Swiss-based company crafting ready-to-drink bottled cocktails. The project translates the brand’s identity into a digital environment through product modeling, lighting, and motion design. The video focuses on freshness, warmth, and conviviality, shaping a visual narrative centered on shared moments.",
  externalLinks: ["https://www.youtube.com/shorts/fiyiR5RWvZQ"],
  mainImage: "sharme_1.webp",
  media,
  video,
  layout,
});

export default sharmeProjectContent;
