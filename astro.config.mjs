import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { postBuildMedia } from "./scripts/post-build-integration.mjs";

export default defineConfig({
  site: "https://hans.askov.dk",
  output: "static",
  integrations: [postBuildMedia()],
  i18n: {
    locales: ["en", "da"],
    defaultLocale: "en",
    routing: "manual",
  },
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
        webp: { effort: import.meta.env.PROD ? 6 : 0 },
        avif: { effort: import.meta.env.PROD ? 9 : 0 },
      },
    },
  },
});
