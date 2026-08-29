export type Lang = "en" | "da";

export type Translation = {
  code: Lang;
  name: string;
  nav: {
    home: string;
    projects: string;
    cv: string;
  };
  sections: {
    contact: string;
    languages: string;
    skills: string;
    aboutMe: string;
  };
  cv: {
    experience: string;
    education: string;
    download: string;
    aboutMe: string;
    ratingOutOf: string;
  };
  location: string;
  spokenLanguages: {
    name: string;
    rating: number;
  }[];
};

const en: Translation = {
  code: "en",
  name: "English",
  nav: {
    home: "Home",
    projects: "Projects",
    cv: "CV",
  },
  sections: {
    contact: "Contact",
    languages: "Languages",
    skills: "Skills",
    aboutMe: "About me",
  },
  cv: {
    experience: "Experience",
    education: "Education",
    download: "Download CV",
    aboutMe: "My hobbies includes tinkering with homeservers and jogging along Odense River.",
    ratingOutOf: "out of 4",
  },
  location: "Odense C, 5000, Denmark",
  spokenLanguages: [
    { name: "Danish", rating: 4 },
    { name: "English", rating: 4 },
  ],
};

const da: Translation = {
  code: "da",
  name: "Dansk",
  nav: {
    home: "Forside",
    projects: "Projekter",
    cv: "CV",
  },
  sections: {
    contact: "Kontakt",
    languages: "Sprog",
    skills: "Kompetencer",
    aboutMe: "Om mig",
  },
  cv: {
    experience: "Erhvervserfaring",
    education: "Uddannelse",
    download: "Download CV",
    aboutMe: "Mine hobbyer inkluderer at rode med homeservers og løbe ture langs Odense Å.",
    ratingOutOf: "ud af 4",
  },
  location: "Odense C, 5000, Danmark",
  spokenLanguages: [
    { name: "Dansk", rating: 4 },
    { name: "Engelsk", rating: 4 },
  ],
};

export const ui: Record<Lang, Translation> = { en, da };
