import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const localeSchema = z.enum(["en", "da"]);
const linkSegment = z.union([z.string(), z.object({ text: z.string(), href: z.string() })]);

const layoutSchema = z.object({
  locale: localeSchema,
  localeToggle: z.object({ en: z.string(), da: z.string() }),
  nav: z.object({
    home: z.string(),
    projects: z.string(),
    cv: z.string(),
    menu: z.string(),
    main: z.string(),
  }),
  sections: z.object({
    contact: z.string(),
    languages: z.string(),
    skills: z.string(),
    aboutMe: z.string(),
  }),
  cv: z.object({
    experience: z.string(),
    education: z.string(),
    download: z.string(),
    aboutMe: z.string(),
    ratingOutOf: z.string(),
  }),
  location: z.string(),
  spokenLanguages: z.array(z.object({ name: z.string(), rating: z.number() })),
});
export type LayoutData = z.infer<typeof layoutSchema>;

const homeSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  description: z.string(),
  role: z.string(),
  location: z.string(),
  viewCv: z.string(),
  browseProjects: z.string(),
  aboutHeading: z.string(),
  latestProjects: z.string(),
  allProjects: z.string(),
  about: z.array(z.array(linkSegment)),
});
export type HomeData = z.infer<typeof homeSchema>;

const layout = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/layout" }),
  schema: layoutSchema,
});

const home = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/home" }),
  schema: homeSchema,
});

const projectsPage = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/projects-page" }),
  schema: z.object({
    locale: localeSchema,
    title: z.string(),
    description: z.string(),
    metaDescription: z.string(),
  }),
});

const cvsPage = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/cvs-page" }),
  schema: z.object({
    locale: localeSchema,
    title: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    download: z.string(),
    viewLetters: z.string(),
  }),
});

const applicationLettersPage = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "./src/content/application-letters-page",
  }),
  schema: z.object({
    locale: localeSchema,
    title: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    download: z.string(),
    viewCvs: z.string(),
  }),
});

const notFound = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/not-found" }),
  schema: z.object({
    locale: localeSchema,
    title: z.string(),
    description: z.string(),
    body: z.string(),
    backHome: z.string(),
    browseProjects: z.string(),
    or: z.string(),
    sendEmail: z.string(),
  }),
});

const applicationLetters = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/application-letters" }),
  schema: z.object({
    slug: z.string(),
    locale: z.enum(["en", "da"]),
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
      locale: z.enum(["en", "da"]),
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

export const collections = {
  layout,
  home,
  projectsPage,
  cvsPage,
  applicationLettersPage,
  notFound,
  applicationLetters,
  cvs,
  projects,
};
