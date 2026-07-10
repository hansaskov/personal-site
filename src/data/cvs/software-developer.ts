import { educations, experiances } from "@data/cvs/fullstack";
import type { Cv } from "@data/cvs";

const intro = `I'm Hans, a software engineer focused on pragmatic software
    development, backend systems, and data-heavy applications. I have shipped
    production software across analytics, computer vision, IoT, and synthetic
    data generation, with a strong interest in building reliable systems that
    are easy to operate and improve.`;

export const software_developer_cv: Cv = {
  slug: "software-developer",
  title: "Software Developer",
  skills: [
    "Backend",
    "C++",
    "Computer Vision",
    "Docker",
    "IoT",
    "PostgreSQL",
    "Python",
    "Typescript",
  ],
  intro: intro,
  experiances: experiances,
  educations: educations,
};
