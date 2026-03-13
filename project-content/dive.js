import { defineProjectContent } from "./shared.js";

const video = {
  hidePlayerChrome: true,
  autoplayMuted: true,
  showUnmuteButton: true,
  loop: true,
  aspectRatio: "4 / 5",
};

const layout = {
  masonry: {
    videoFullWidth: true,
  },
};

const diveProjectContent = defineProjectContent({
  id: "dive",
  description:
    "*Dive* is a 3D workshop project based on the representation of a meaningful moment. This work focuses on the suspended instant mid-air after leaving a diving board. Rather than depicting movement itself, the project isolates the pause within it, a brief state where time expands and gravity feels momentarily absent.",
  collaboration: "Workshop by Vincent Schwenk",
  externalLinks: ["https://www.youtube.com/watch?v=KTAeynapt-I"],
  media: [],
  video,
  layout,
});

export default diveProjectContent;
