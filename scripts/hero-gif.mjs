/* Records the README's animated hero. Run `npm run hero`, then open
   http://localhost:5182/hero-gif.html?theme=dark&sink=http://localhost:5199
   (and again with theme=light) while `npm run dev` is up. The page renders
   every frame on a canvas and posts it here; on `done` this writes
   docs/hero-<theme>.gif with ffmpeg (a palette per clip, ordered dither so
   the gradients hold still) and squeezes it with gifsicle. POST /done on
   its own re-encodes the frames already on disk. */

import { createServer } from "node:http";
import { mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 5199;
const THEMES = new Set(["dark", "light"]);

const frames = (theme) => resolve(root, ".frames", theme);

function encode(theme, fps) {
  const gif = resolve(root, "docs", `hero-${theme}.gif`);
  execFileSync("ffmpeg", [
    "-v", "error", "-y",
    "-framerate", String(fps),
    "-i", `${frames(theme)}/%03d.png`,
    /* drawn at 1280 and 25 fps, kept at 1024 (the width of a README) and
       20 fps: about two thirds the bytes, the same on screen */
    "-vf", "fps=20,scale=1024:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
    "-loop", "0",
    gif,
  ]);
  execFileSync("gifsicle", ["-O3", "--lossy=30", "--batch", gif]);
  return { gif, bytes: statSync(gif).size };
}

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const theme = url.searchParams.get("theme");
  if (req.method !== "POST" || !THEMES.has(theme)) {
    res.statusCode = 400;
    return res.end("bad request");
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    try {
      if (url.pathname === "/start") {
        rmSync(frames(theme), { recursive: true, force: true });
        mkdirSync(frames(theme), { recursive: true });
      } else if (url.pathname === "/frame") {
        const i = Number(url.searchParams.get("i"));
        writeFileSync(`${frames(theme)}/${String(i).padStart(3, "0")}.png`, Buffer.concat(chunks));
      } else if (url.pathname === "/done") {
        const { gif, bytes } = encode(theme, Number(url.searchParams.get("fps")) || 25);
        console.log(`wrote ${gif} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
      }
      res.end("ok");
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end(String(e));
    }
  });
}).listen(PORT, () => console.log(`hero frame sink on http://localhost:${PORT}`));
