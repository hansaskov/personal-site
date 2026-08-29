import { fileURLToPath } from "node:url";
import { postBuild } from "./post-build.mjs";

export function postBuildMedia() {
  return {
    name: "post-build-media",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        await postBuild(fileURLToPath(dir), logger);
      },
    },
  };
}
