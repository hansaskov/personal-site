import { educations, experiances } from "@data/cvs/fullstack";
import type { Cv } from "@data/cvs";

const intro = `I'm Hans, a software engineer focused on pragmatic software
    development, backend systems, and data-heavy applications. I have shipped
    production software with a strong interest in building reliable systems that
    are easy to operate and improve.`;

export const software_developer_cv: Cv = {
  slug: "software-engineer",
  title: "Software Engineer",
  skills: [
    "Fullstack",
    "Backend",
    "Docker",
    "IoT",
    "PostgreSQL",
    "Python",
    "Typescript",
    "Cyber Security"
  ],
  intro: intro,
  experiances: experiances,
  educations: educations,
};
