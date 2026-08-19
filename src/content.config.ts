import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const applicationLetters = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/application-letters" }),
  schema: z.object({
    slug: z.string(),
  }),
});

export const collections = { applicationLetters };
