import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const distRoot = resolve(process.cwd(), "dist");

const staticSnippetDirs = [
  "project_utiliser/creative-coding/Beurre",
  "project_utiliser/creative-coding/Ecosystem",
];

if (!existsSync(distRoot)) {
  console.error("dist/ not found. Run the build step first.");
  process.exit(1);
}

for (const relativeDir of staticSnippetDirs) {
  const sourceDir = resolve(process.cwd(), relativeDir);
  const destinationDir = resolve(distRoot, relativeDir);

  if (!existsSync(sourceDir)) {
    console.warn(`Skipping missing source: ${relativeDir}`);
    continue;
  }

  mkdirSync(dirname(destinationDir), { recursive: true });
  rmSync(destinationDir, { recursive: true, force: true });
  cpSync(sourceDir, destinationDir, { recursive: true });
  console.log(`Copied static snippet assets: ${relativeDir}`);
}
