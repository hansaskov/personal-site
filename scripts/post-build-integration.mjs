import { fileURLToPath } from "node:url";
import { postBuild } from "./post-build.mjs";

export function postBuildMedia() {
  let cacheDir;
  return {
    name: "post-build-media",
    hooks: {
      "astro:config:setup": ({ config }) => {
        cacheDir = fileURLToPath(config.cacheDir);
      },
      "astro:build:done": async ({ dir, logger }) => {
        await postBuild(fileURLToPath(dir), cacheDir, logger);
      },
    },
  };
}
