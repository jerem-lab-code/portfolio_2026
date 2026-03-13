import { defineProjectContent } from "./shared.js";

const media = [{ src: "test_4.webp" }, { src: "test_7.webp", fullWidth: true }];

const layout = {
  masonry: {
    includeMainImageInGrid: true,
    videoPlacement: "start",
  },
};

const video = {
  aspectRatio: "1018 / 1204",
  hidePlayerChrome: true,
  autoplayMuted: true,
  loop: true,
  showUnmuteButton: true,
  cropZoom: 1.02,
};

const mariageStoryProjectContent = defineProjectContent({
  id: "mariage-story",
  description: "*Marriage Story* is a Firebase-based creative coding project developed from a brief to design a conversation between two people. The project draws from a scene in *Marriage Story* in which two characters progressively dismantle each other through dialogue. This dynamic is translated into two vertical structures that collapse in rhythm with the intensity of the exchange.\n\nPresented as an installation, viewers stood between two facing screens, positioned as if witnessing their parents’ divorce, immersed in the emotional tension of the confrontation.",
  externalLinks: ["https://www.youtube.com/shorts/zODxCFCZiVM"],
    collaboration: "Collaboration: Alexandre Gambarini",

  media,
  layout,
  video,
});

export default mariageStoryProjectContent;
