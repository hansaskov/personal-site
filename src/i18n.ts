import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";

export type Locale = "en" | "da";

export const locales: Locale[] = ["en", "da"];

export const localeStaticPaths = () => locales.map((locale) => ({ params: { locale } }));

export const otherLocale = (locale: Locale): Locale => (locale === "en" ? "da" : "en");

export const localeToggle = (locale: Locale, page?: string) => {
  const target = otherLocale(locale);
  return { target, href: page ? getRelativeLocaleUrl(target, page) : getRelativeLocaleUrl(target) };
};

export const humanizeSlug = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const pageUrl = (locale: Locale, page?: string) => getRelativeLocaleUrl(locale, page);

export const hreflangUrls = (page?: string) => ({
  en: getRelativeLocaleUrl("en", page),
  da: getRelativeLocaleUrl("da", page),
});

export const getSortedProjects = async (limit?: number) => {
  const projects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
  return limit ? projects.slice(0, limit) : projects;
};

type DocCollection = "cvs" | "applicationLetters";

export const getLocaleDocs = async (
  collection: DocCollection,
  locale: Locale,
  dir: "asc" | "desc" = "asc",
) => {
  const docs = (await getCollection(collection)).filter((doc) => doc.data.locale === locale);
  const factor = dir === "asc" ? 1 : -1;
  return docs.sort((a, b) => factor * a.data.slug.localeCompare(b.data.slug));
};

export const enSlugStaticPaths = async <C extends DocCollection>(collection: C) =>
  (await getCollection(collection, ({ data }) => data.locale === "en")).map((entry) => ({
    params: { slug: entry.data.slug },
  }));

export const localeSlugStaticPaths = async <C extends DocCollection>(collection: C) =>
  (await getCollection(collection)).map((entry) => ({
    params: { locale: entry.data.locale, slug: entry.data.slug },
    props: { entry },
  }));

// Default CV shown by the `/cv` landing rewrite per locale. Single-sourced so
// `src/pages/cv.astro` and `src/pages/[locale]/cv.astro` cannot drift apart.
export const defaultCvSlug: Record<Locale, string> = {
  en: "software-developer",
  da: "softwareingenior",
};

type LocalizedCollection =
  | "layout"
  | "home"
  | "projectsPage"
  | "cvsPage"
  | "applicationLettersPage"
  | "notFound";

export async function getLocalized<C extends LocalizedCollection>(collection: C, locale: Locale) {
  const entries = await getCollection(collection);
  const entry = entries.find(({ data }) => data.locale === locale);
  if (!entry) {
    throw new Error(`Missing '${locale}' entry in the '${collection}' collection`);
  }
  return entry;
}
