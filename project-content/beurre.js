import { defineProjectContent } from "./shared.js";

const media = [
  { src: "beurre_thumbnail.webp" },
  {
    type: "snippet",
    src: "beurre_thumbnail.webp",
    fullWidth: true,
    entry: "code_snippet_sketch.js",
  },
];

const beurreProjectContent = defineProjectContent({
  id: "beurre",
  description: "*Beurre* is a creative coding project developed during a one-week workshop centered on the theme of satisfaction. The objective was to design a single interaction focused entirely on sensory precision. What could be more satisfying than cutting a perfectly smooth slice of butter? Nothing.",
  media,
      collaboration: "Collaboration: Mario Van Rickenbach, Sébatien Matos",

});

export default beurreProjectContent;
