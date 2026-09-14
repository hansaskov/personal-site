import { getCollection } from "astro:content";

export type Locale = "en" | "da";

export const locales: Locale[] = ["en", "da"];

export const localeStaticPaths = () =>
  locales.map((locale) => ({ params: { locale } }));

export const otherLocale = (locale: Locale): Locale => (locale === "en" ? "da" : "en");

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
