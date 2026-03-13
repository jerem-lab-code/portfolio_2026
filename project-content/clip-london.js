import { defineProjectContent } from "./shared.js";

const media = [
  { src: "london_1.webp" },
  { src: "london_2.webp" },
  { src: "london_3.webp" },
  { src: "london_4.webp" },
  { src: "london_5.webp" },
];

const video = {
  hidePlayerChrome: false,
  autoplayMuted: true,
  showUnmuteButton: true,
  loop: true,
  aspectRatio: "16 / 9",
};

const layout = {
  masonry: {
    videoFullWidth: true,
  },
};

const clipLondonProjectContent = defineProjectContent({
  id: "clip-london",
  description: "*London* is a music video created for the song London by Chelan. The project translates the artist’s colorful and vibrant identity into a tactile visual universe.\n\nA clay-like texture shapes the environments and characters, creating a dialogue between digital construction and handcrafted appearance. The colour treatment follows the rhythm and energy of the track.",
  externalLinks: ["https://www.youtube.com/watch?v=wr6ztAVxLTo"],
  mainImage: "london_1.webp",
  media,
  collaboration: "Collaboration: Project developed with Alexandre Gambarini\nMusic: Chelan",

  video,
  layout,
});

export default clipLondonProjectContent;
