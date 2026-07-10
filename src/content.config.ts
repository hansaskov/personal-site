import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const RoleSchema = z.object({
  title: z.string(),
  year: z.string(),
  duration: z.string(),
  location: z.string(),
  description: z.string(),
});

const ExperianceSchema = z.object({
  company: z.string(),
  year: z.string(),
  duration: z.string(),
  img: z.file(),
  role: z.array(RoleSchema),
});

const EducationSchema = ExperianceSchema;

const cvs = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/data/cvs" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    intro: z.string(),
    skills: z.array(z.string()),
    experiances: z.array(ExperianceSchema),
    educations: z.array(EducationSchema),
  }),
});

export const collections = { cvs };
