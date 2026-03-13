import { defineProjectContent } from "./shared.js";

const media = [
  { src: "VIDEO-2023-10-24-17-15-37.mp4", showUnmuteButton: false, column: "right" },
  { src: "plan_large_2_grand.webp" },
  { src: "nake_casque copie2.webp" },
  { src: "cart_pose copie.webp" },
  { src: "back_closeup3 copie.webp" },
 
  { src: "casque_close_up copie.webp" },
  { src: "back_closeUp2 copie.webp" },
  { src: "uder_one_bridge.webp" },
   { src: "card.mp4", showUnmuteButton: false },
  { src: "nake_casque_3 copie.webp" },
  { src: "under_the_two_bridge.webp" },
];

const kaijuProjectContent = defineProjectContent({
  id: "kaiju",
  description: "*Kaiju* explores the creative collision between Japanese and Swiss folklore through contemporary visual storytelling. In Japanese culture, a *kaiju*, literally “strange beast”, is a giant creature embodying both destruction and protection.\n\nThe project reinterprets this figure through a cross-cultural lens. The creature merges elements of Swiss watchmaking with traditional samurai helmet ornaments (*maedate* ), forming a hybrid guardian of Odaiba Bay, a modern reincarnation of the cannons that once protected it.",
    collaboration: "The project was presented during Expo 2025 Osaka and Milan Design Week.\nCollaboration: Sébastien Matos (3D Trading Card) - Jamy Herrmann , Julien Gurtner (Trading Card Game Design).",

  media,
});

export default kaijuProjectContent;
