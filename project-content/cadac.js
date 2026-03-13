import { defineProjectContent } from "./shared.js";

const media = [
 
  { src: "black_card_2.webp", fullWidth: true },
 
  { src: "v2_tote_final.webp" },
  { src: "cadac_screen_1.webp" },
  { src: "v3_tote_final.webp" },

  { src: "poster_3.webp" },
  //  { src: "final_1.webp" },
     { src: "V1_tote_finale.webp" },
  { src: "tool_cadac_optimized.mp4", showUnmuteButton: false },

   
  { src: "video_mockup_optimized.mp4", showUnmuteButton: false },
];

const layout = {
  masonry: {
    desktopColumns: 3,
    includeMainImageInGrid: true,
  },
};

const cadacProjectContent = defineProjectContent({
  id: "cadac",
  description: "*CADAC* is a fictitious visual identity for an imagined Contemporary Architectural Center based in Switzerland. The system is structured around the principle of paper folding, translating architectural logic into a graphic language of sharp planes and shifting geometries. Rather than relying on a fixed logo, the identity operates as a generative system, producing evolving compositions through a defined folding structure.\n\nA custom digital tool was developed in JavaScript to generate and control the folding effect across applications.",
  media,
  layout,
});

export default cadacProjectContent;
