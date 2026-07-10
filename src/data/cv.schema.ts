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
