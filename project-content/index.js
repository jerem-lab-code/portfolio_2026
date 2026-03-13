import beurreProjectContent from "./beurre.js";
import cadacProjectContent from "./cadac.js";
import chefCocoProjectContent from "./chef-coco.js";
import clipLondonProjectContent from "./clip-london.js";
import diveProjectContent from "./dive.js";
import ecosystemProjectContent from "./ecosystem.js";
import hectorProjectContent from "./hector.js";
import ilandUniverseProjectContent from "./iland-universe.js";
import kaijuProjectContent from "./kaiju.js";
import mariageStoryProjectContent from "./mariage-story.js";
import sharmeProjectContent from "./sharme.js";

const projectContentList = [
  // 3D
  clipLondonProjectContent,
  diveProjectContent,
  hectorProjectContent,
  ilandUniverseProjectContent,
  kaijuProjectContent,
  sharmeProjectContent,

  // Visual identity
  cadacProjectContent,
  chefCocoProjectContent,

  // Creative coding
  beurreProjectContent,
  ecosystemProjectContent,
  mariageStoryProjectContent,
];

export const projectCopyById = Object.fromEntries(
  projectContentList.map((projectContent) => [projectContent.id, projectContent])
);
