import { defineProjectContent } from "./shared.js";

const media = [
  { src: "logo_iland_universe.webp", fullWidth: true, className: "iland-logo" },
  { src: "Rectangle 11.webp" },
  { src: "Rectangle 12.webp" },
  { src: "Rectangle 12_2.webp" },
  { src: "Rectangle 13.webp" },
  { src: "Rectangle 14.webp" },
  {
    src: "Enregistrement de l’écran 2024-06-24 à 10.40.26.mp4",
    fullWidth: true,
    showUnmuteButton: false,
  },
  { src: "map_mockup_front.webp", fullWidth: true },
  { src: "map_mockup_back.webp" },
  { src: "iland_cover.webp" },
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

const ilandUniverseProjectContent = defineProjectContent({
  id: "iland-universe",
  description: "*iLand Universe* explores the world of amusement parks as a metaphor for the overuse of smartphones. Through architecture, scenography, and rollercoasters, the project builds a fictional park shaped by digital behaviors.\n\nPresented as an “epic” teaser, it adopts the promotional language of traditional U.S. theme parks, embracing their sense of scale, spectacle, and immersion. Born from a long-standing fascination with theme park culture, the project constructs a world suspended between attraction and reflection.",
  externalLinks: ["https://www.youtube.com/watch?v=Izm5OjJntZk&t=6s"],
  collaboration: "Currently exhibited at Le Cube Garges, Paris (2025–2026).\nCast: Lorna Dessaux as Nova Wheelers.",
  media,
  video,
  layout,
});

export default ilandUniverseProjectContent;
