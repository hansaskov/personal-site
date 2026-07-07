import TriVisionLogo from "@media/trivision_logo.jpg";
import NovoNordiskLogo from "@media/novo_nordisk_logo.jpg";
import EffimatLogo from "../media/effimat_logo.jpg";
import SduLogo from "@media/sdu_logo.jpg";

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
  intro: string;
  experiances: Experiance[];
  educations: Education[];
}

const intro = `I'm Hans, a software engineer who specialize in fullstack web development
    and building systems that hold up under real load. I have built a production
    analytics platform ingesting 420M+ inspections a year, cutting dashboard
    load times by 100× and storage costs by 92%. Now looking to bring that
    performance and cost discipline to a backend or fullstack role.`;

const experiances: Experiance[] = [
  {
    company: "TriVision A/S",
    year: "February 2024 - May 2026",
    duration: "2 years 4 months",
    img: TriVisionLogo,
    roles: [
      {
        title: "Software Engineer",
        year: "February 2024 - May 2026",
        duration: "10 months",
        location: "Odense",
        description:
          "Shipped Production Intelligence V4, a production analytics platform ingesting 420M+ machine vision inspections annually across TriVision's customer base. Improved load times from 10s to 0.1s by rendering and caching static pages on the server periodically. Then i and containerized and deployed the full stack on AWS with Docker.",
      },
      {
        title: "Student Software Developer",
        year: "February 2024 - August 2025",
        duration: "1 year 7 months",
        location: "Odense",
        description:
          "Contributed to the architecture behind Production Intelligence V4, prototyping the data ingestion pipeline and evaluating columnar storage formats that later cut storage costs by 92%. Worked across the backend stack in a live production environment, translating MSc coursework in distributed systems into real engineering.",
      },
    ],
  },
  {
    company: "Novo Nordisk A/S",
    year: "September 2022 - February 2023",
    duration: "6 months",
    img: NovoNordiskLogo,
    roles: [
      {
        title: "Student Software Developer",
        year: "September 2022 - February 2023",
        duration: "6 months",
        location: "Hillerød",
        description:
          "At Novo Nordisk I developed and implemented a pipeline to render synthetically generated images which were used to train two deep learning models for object detection and 6DoF pose estimation for components in a bin. An open-source recreation is available at https://github.com/hansaskov/BlenderBin",
      },
    ],
  },
  {
    company: "EFFIMAT",
    year: "February 2022 - February 2023",
    duration: "1 year 1 month",
    img: EffimatLogo,
    roles: [
      {
        title: "Software Developer",
        year: "February 2022 - February 2023",
        duration: "1 year 1 month",
        location: "Odense",
        description:
          "As a member of the Effimat team, I honed my skills within the field of Internet of Things, by working with data collection and analysis of distributed systems. A website was then developed to show real-time data, which was used to gain insight of their products.",
      },
    ],
  },
  /*
  {
    company: "Southern University of Denmark",
    duration: "May 2021 - June 2021",
    img: SduLogo,
    roles: [
      {
        title: "Mathematics Instructor",
        year: "May 2021 - June 2021",
        duration: "2 months",
        location: "Odense",
        description:
          'I worked as an instructor in the SDU event "Mat Spurten" which deals with refreshing 3.g students for the Mathematics A exam. It is a task that requires patience and dissemination of complicated subjects.',
      },
    ],
  },
  */
];

const educations: Education[] = [
  {
    company: "Southern University of Denmark",
    year: "2019 - 2025",
    duration: "5 years 5 months",
    img: SduLogo,
    roles: [
      {
        title: "MSc in Software Engineering",
        description:
          "Specialization in distributed systems and backend engineering, with electives in cybersecurity, data security and biometric security. ",
        year: "2023 - 2025",
        duration: "2 years",
        location: "Odense",
      },
      {
        title: "BEng in Robotic Systems",
        description:
          "Robotics introduced my love for software and mathematics, this includes control theory, computer vision, and ML. A key project was to program a UR5 robot arm to detect, grasp and throw objects using collision-aware motion planning.",
        year: "2019 - 2023",
        duration: "3 years 5 months",
        location: "Odense",
      },
    ],
  },
];

export const CV: Cv = {
  intro: intro,
  experiances: experiances,
  educations: educations,
};
