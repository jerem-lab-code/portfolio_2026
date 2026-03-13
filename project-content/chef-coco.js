import { defineProjectContent } from "./shared.js";

const media = [
  { src: "chef_coco_story_2.webp" },
  { src: "chef_coco_story_1.webp" },
  { src: "chef_coco_splash.webp" },
  { src: "chef_coco_tab_1.webp" },
  { src: "chef_coco_tab_2.webp" },
  { src: "User_Mealplan.webp" },
  { src: "SOCIAL.webp" },
  { src: "SOCIAL-1.webp" },
  { src: "MOCKUP.webp" },
  { src: "MOCKUP-1.webp" },
  { src: "MOCKUP-2.webp" },
  { src: "chef_coco_mockup.webp" },
  { src: "DSCF1555.webp" },
  { src: "DSCF1567.webp" },
];

const chefCocoProjectContent = defineProjectContent({
  id: "chef-coco",
  description: "Chef Coco is a Berlin-based fresh meal delivery service offering a rotating weekly menu through a dedicated mobile application. Developed within a team at Forpeople Amsterdam, the project included the UX and UI design of the mobile app, from menu discovery to checkout. The digital visual identity was also defined, including logo variations and a custom icon system integrated into the interface. The project went live in 2022.",
   collaboration: "  Collaboration: Forpeople Amsterdam",

  media,
});

export default chefCocoProjectContent;
