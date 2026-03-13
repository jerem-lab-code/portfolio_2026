import { defineProjectContent } from "./shared.js";

const media = [
  { src: "export_music_v3.mp4", fullWidth: true },
  { src: "picture_4.webp" },
  { src: "Mouton.webp" },
  { src: "boule.webp" },
  {src: "flat.webp"},

];

const layout = {
  masonry: {
    desktopColumns: 2,
  },
};

const hectorProjectContent = defineProjectContent({
  id: "hector",
  description: "*Hector* is a 3D product project developed around a full-wool carpet collection designed and produced by Arthur Moreillon. The rugs are made from 100% Swiss sheep wool, a material increasingly devalued, with nearly 70% of national production burned each year.\n\nThe project focuses on the art direction and staging of the collection through image and atmosphere. The visual direction reconnects the material to its origin: open landscapes and the distant sound of bells. Through 3D environments and video, the work establishes a quiet continuity between the product and its natural source.",
  collaboration: "Collaboration: product design and production by Arthur Moreillon.",
  media,
  layout,
});

export default hectorProjectContent;
