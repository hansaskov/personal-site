import { educations, experiances } from "@data/cvs/fullstack";
import type { Cv } from "@data/cvs";

const intro = `I'm Hans, a software engineer with a DevOps mindset and hands-on
    experience containerizing, deploying, and operating production systems. I
    have worked with Docker, AWS, Grafana, backend services, and data pipelines,
    with an emphasis on performance, cost discipline, and systems that can be
    maintained in production.`;

export const devops_cv: Cv = {
  slug: "devops",
  title: "DevOps Engineer",
  skills: [
    "AWS",
    "Backend",
    "DevOps",
    "Docker",
    "Grafana",
    "Linux",
    "PostgreSQL",
    "Systems",
    "Typescript",
  ],
  intro: intro,
  experiances: experiances,
  educations: educations,
};
