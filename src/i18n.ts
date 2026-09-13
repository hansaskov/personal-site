export type Locale = "en" | "da";

export type Translation = {
  code: Locale;
  name: string;
  nav: {
    home: string;
    projects: string;
    cv: string;
    menu: string;
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
  pages: {
    home: {
      title: string;
      description: string;
      role: string;
      location: string;
      viewCv: string;
      browseProjects: string;
      aboutHeading: string;
      latestProjects: string;
      allProjects: string;
    };
    projects: {
      title: string;
      description: string;
      metaDescription: string;
    };
    cvs: {
      title: string;
      description: string;
      metaDescription: string;
      download: string;
      viewLetters: string;
    };
    letters: {
      title: string;
      description: string;
      metaDescription: string;
      download: string;
      viewCvs: string;
    };
    notFound: {
      title: string;
      description: string;
      body: string;
      backHome: string;
      browseProjects: string;
      or: string;
      sendEmail: string;
    };
  };
};

const en: Translation = {
  code: "en",
  name: "English",
  nav: {
    home: "Home",
    projects: "Projects",
    cv: "CV",
    menu: "Menu",
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
    aboutMe: "My hobbies include tinkering with homeservers and jogging along Odense River.",
    ratingOutOf: "out of 4",
  },
  location: "Odense C, 5000, Denmark",
  spokenLanguages: [
    { name: "Danish", rating: 4 },
    { name: "English", rating: 4 },
  ],
  pages: {
    home: {
      title: "Home",
      description: "Personal website for Hans Askov",
      role: "Software Engineer",
      location: "Odense C, Region of Southern Denmark, Denmark",
      viewCv: "View CV",
      browseProjects: "Browse projects",
      aboutHeading: "About Me",
      latestProjects: "Latest Projects",
      allProjects: "All projects",
    },
    projects: {
      title: "Projects",
      description: "Things I have designed, built and shipped.",
      metaDescription: "List of all projects Hans Askov has worked on",
    },
    cvs: {
      title: "CVs",
      description: "The different versions of my CV, each tailored to a specific kind of role.",
      metaDescription: "List of CVs written by Hans Askov",
      download: "Download",
      viewLetters: "View Application Letters",
    },
    letters: {
      title: "Application Letters",
      description:
        "Letters I have written when applying for positions, kept here as writing samples.",
      metaDescription: "List of application letters written by Hans Askov",
      download: "Download",
      viewCvs: "View CVs",
    },
    notFound: {
      title: "404: Not Found",
      description: "Oops, something went wrong",
      body: "The page you're looking for couldn't be found. It may have been moved or never existed.",
      backHome: "Back home",
      browseProjects: "Browse projects",
      or: "Or",
      sendEmail: "send me an email",
    },
  },
};

const da: Translation = {
  code: "da",
  name: "Dansk",
  nav: {
    home: "Forside",
    projects: "Projekter",
    cv: "CV",
    menu: "Menu",
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
    aboutMe: "I min fritid roder jeg med hjemmeservere og jogger langs Odense Å.",
    ratingOutOf: "ud af 4",
  },
  location: "Odense C, 5000, Danmark",
  spokenLanguages: [
    { name: "Dansk", rating: 4 },
    { name: "Engelsk", rating: 4 },
  ],
  pages: {
    home: {
      title: "Forside",
      description: "Personlig hjemmeside for Hans Askov",
      role: "Softwareingeniør",
      location: "Odense C, Region Syddanmark, Danmark",
      viewCv: "Se CV",
      browseProjects: "Se projekter",
      aboutHeading: "Om mig",
      latestProjects: "Seneste projekter",
      allProjects: "Alle projekter",
    },
    projects: {
      title: "Projekter",
      description: "Ting, jeg har designet, bygget og leveret.",
      metaDescription: "Liste over alle projekter Hans Askov har arbejdet på",
    },
    cvs: {
      title: "CV'er",
      description: "De forskellige versioner af mit CV, hver tilpasset en bestemt type stilling.",
      metaDescription: "Liste over CV'er skrevet af Hans Askov",
      download: "Download",
      viewLetters: "Se ansøgninger",
    },
    letters: {
      title: "Ansøgninger",
      description:
        "Ansøgninger jeg har skrevet i forbindelse med jobopslag, gemt her som skriveprøver.",
      metaDescription: "Liste over ansøgninger skrevet af Hans Askov",
      download: "Download",
      viewCvs: "Se CV'er",
    },
    notFound: {
      title: "404: Siden blev ikke fundet",
      description: "Hov, der gik noget galt",
      body: "Siden, du leder efter, kunne ikke findes. Den er muligvis flyttet eller har aldrig eksisteret.",
      backHome: "Tilbage til forsiden",
      browseProjects: "Se projekter",
      or: "Eller",
      sendEmail: "send mig en email",
    },
  },
};

export const ui: Record<Locale, Translation> = { en, da };
