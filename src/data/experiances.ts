import TriVisionLogo from "@media/trivision_logo.jpg";
import NovoNordiskLogo from "@media/novo_nordisk_logo.jpg";
import EffimatLogo from "@media/effimat_logo.jpg";
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

export const experiances: Experiance[] = [
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
          "Launched Production Intelligence V4, a production analytics platform used by factory owners to gain insight into their production lines. 420M+ product inspections stored annually across TriVision customers. Reduced customer dashboard load times from 10s to 0.1s (~100× speedup). Cut storage costs by 92% by migrating to a columnar format with compression. Containerized and deployed the production environment on AWS using Docker.",
      },
      {
        title: "Student Software Developer",
        year: "February 2024 - August 2025",
        duration: "1 year 7 months",
        location: "Odense",
        description: "Test 123",
      },
    ],
  },
  {
    company: "Novo Nordisk",
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
