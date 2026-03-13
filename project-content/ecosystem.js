import { defineProjectContent } from "./shared.js";

const media = [
  {
    type: "snippet",
    src: "screenshot_1.webp",
    fullWidth: true,
    entry: "code_snippet_ecosystem.js",
    useAsHero: false,
  },
  {
    src: "video_1_optimized.mp4",
    style: "aspect-ratio: 1/1; object-fit: cover;",
    showUnmuteButton: false,
  },
  { src: "img.webp" },
  { src: "EcosystemAMS1.webp" },
  {
    src: "video_3_optimized.mp4",
    style: "object-fit: cover; object-position: center bottom;",
    showUnmuteButton: false,
  },
  { src: "EcosystemAMS26.webp" },
  { src: "EcosystemAMS41.webp" },
  { src: "EcosystemAMS42.webp" },
  { src: "video_2_optimized.mp4", showUnmuteButton: false },
  { src: "EcosystemAMS43.webp" },
];

const layout = {
  masonry: {
    desktopColumns: 3,
  },
};

const ecosystemProjectContent = defineProjectContent({
  id: "ecosystem",
  description: "*Ecosystem* is a webpage developed to celebrate the anniversary of the new Forpeople studio in Amsterdam. The platform presents the studio’s work through the metaphor of an ecosystem, structuring projects as interconnected elements within a dynamic digital environment.\n\nBuilt through custom code, the website integrates motion and interactive behaviors to encourage exploration beyond a traditional portfolio format. The live studio version incorporated camera tracking, allowing the interface to respond to the movement of visitors in front of the screen. The version presented includes adapted content and personal photography for confidentiality reasons.",
  collaboration: "Collaboration: Forpeople amsterdam",
  media,
  layout,
});

export default ecosystemProjectContent;
