import { devops_cv } from "@data/cvs/devops";
import { fullstack_cv } from "@data/cvs/fullstack";
import { software_developer_cv } from "@data/cvs/software-developer";

export interface Role {
  title: string;
  year: string;
  duration: string;
  location: string;
  description: string;
}

export interface Experiance {
  company: string;
  year: string;
  duration: string;
  img: ImageMetadata;
  roles: Role[];
}

export interface Education extends Experiance {}

export interface Cv {
  slug: string;
  title: string;
  intro: string;
  skills: string[];
  experiances: Experiance[];
  educations: Education[];
}

export const defaultCvSlug = software_developer_cv.slug;

export const cvs = [fullstack_cv, software_developer_cv, devops_cv] satisfies Cv[];

export const cvBySlug = new Map(cvs.map((cv) => [cv.slug, cv]));
