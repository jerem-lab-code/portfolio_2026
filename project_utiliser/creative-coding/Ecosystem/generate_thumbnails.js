import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = '/Users/jeremiekursner/Desktop/Portfolio_JK_2026';
const ECOSYSTEM_DIR = path.join(PROJECT_ROOT, 'project_utiliser/creative-coding/Ecosystem');
const SOURCE_LIST = path.join(ECOSYSTEM_DIR, 'image_list.json');
const THUMB_DIR_NAME = 'thumbnails';
const THUMB_DIR = path.join(ECOSYSTEM_DIR, 'assets', THUMB_DIR_NAME);

// Ensure thumbnail repository exists
if (!fs.existsSync(THUMB_DIR)) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
}

// Read and parse image list manually since import assertion is experimental
const imageList = JSON.parse(fs.readFileSync(SOURCE_LIST, 'utf8'));
const thumbnailList = [];

console.log(`Processing ${imageList.length} images...`);

for (let i = 0; i < imageList.length; i++) {
    const imgRelPath = imageList[i];
    // imgRelPath looks like "/project_utiliser/..."
    // We need to resolve this to absolute path.
    // The previous attempt failed. Let's try to be smarter.
    // If we run from PROJECT_ROOT, "project_utiliser/..." should be correct.

    let absPath = path.join(PROJECT_ROOT, imgRelPath.startsWith('/') ? imgRelPath.slice(1) : imgRelPath);

    // Fallback: try relative to the script execution if helpful, or debug
    // console.log(`[DEBUG] Attempt 1 failed: ${absPath}`);

    // Create a flat filename for the thumbnail to avoid recreating directory structure
    // e.g. "visual-identity-CADAC-v3_tote_final.webp"
    // Remove "project_utiliser" to make names shorter if possible, or just flatten.
    const parts = imgRelPath.split('/').filter(p => p);
    // Let's keep it simple: replace / with -
    const safeName = parts.join('-').replace('project_utiliser-', '');
    // Replace extension with .jpg
    const thumbFilename = safeName.replace(/\.[^/.]+$/, "") + ".jpg";
    const thumbPath = path.join(THUMB_DIR, thumbFilename);

    try {
        if (fs.existsSync(absPath)) {
            // Use sips to resize to max 512px width/height
            // -Z 512: maintains aspect ratio, max dimension 512
            // -s format jpeg: ensure output is jpeg
            try {
                // Removing stdio ignore to see errors
                execSync(`sips -Z 512 -s format jpeg "${absPath}" --out "${thumbPath}"`);
            } catch (sipsErr) {
                console.error(`[SIPS ERROR] Failed on ${absPath}: ${sipsErr.message}`);
                continue;
            }

            // Store mapping: original path -> thumbnail filename
            // The snippet needs the original path as ID for tags.
            thumbnailList.push({
                original: imgRelPath,
                thumbnail: thumbFilename
            });
            console.log(`[${i + 1}/${imageList.length}] Generated: ${thumbFilename}`);
        } else {
            console.warn(`[WARN] Source file not found: ${absPath}`);
        }
    } catch (e) {
        console.error(`[ERROR] Failed to process ${absPath}:`, e.message);
    }
}

fs.writeFileSync(path.join(ECOSYSTEM_DIR, 'thumbnail_map.json'), JSON.stringify(thumbnailList, null, 2));
console.log('Done! Created thumbnail_map.json');
