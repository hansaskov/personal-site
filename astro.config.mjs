import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://hans.askov.dk",
  output: "static",
  build: {
    inlineStylesheets: "always",
  },
  prefetch: {
    defaultStrategy: "load",
    prefetchAll: true,
  },
  vite: {
    plugins: [tailwindcss()],
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
