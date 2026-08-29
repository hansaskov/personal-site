import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { postBuildMedia } from "./scripts/post-build-integration.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://hans.askov.dk",
  output: "static",
  integrations: [postBuildMedia()],
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
    preview: {
      allowedHosts: ["hans.askov.dk"],
    },
  },

  image: {
    service: {
      config: {
        webp: { effort: import.meta.env.PROD ? 6 : 0 }, // Run highest effort in prod
        avif: { effort: import.meta.env.PROD ? 9 : 0 }, // Run highest effort in prod
      },
    },
  },
});
