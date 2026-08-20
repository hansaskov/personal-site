import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const applicationLetters = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/application-letters" }),
  schema: z.object({
    slug: z.string(),
  }),
});

const cvs = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cvs" }),
  schema: ({ image }) => {
    const role = z.object({
      title: z.string(),
      year: z.string(),
      duration: z.string(),
      location: z.string(),
      description: z.string(),
    });

    const timeline = z.object({
      company: z.string(),
      year: z.string(),
      duration: z.string(),
      img: image(),
      roles: z.array(role),
    });

    return z.object({
      slug: z.string(),
      title: z.string(),
      intro: z.string(),
      skills: z.array(z.string()),
      experiances: z.array(timeline),
      educations: z.array(timeline),
    });
  },
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      desc: z.string(),
      url: z.string(),
      img: image(),
      order: z.number(),
      year: z.string().optional(),
      badge: z.string().optional(),
      target: z.string().optional(),
    }),
});

export const collections = { applicationLetters, cvs, projects };
