import AskovPreview from "../media/askov.webp";
import HjemmetPreview from "../media/hjemmet.webp";
import BlenderBinPreview from "../media/blenderbin.webp";
import PersonalSitePreview from "../media/personal-site.webp";
import ExtractWindowsKeyPreview from "../media/post_img.webp";
import ProductionIntelligenceV4 from "../media/Production-Intelligence-V4.png";

export interface Project {
  title: string;
  img: ImageMetadata;
  desc: string;
  url: string;
  year?: string;
  badge?: string;
  target?: string;
}
export const projects: Project[] = [
  {
    title: "Pi.trivision.io",
    desc: "At TriVision I was the lead developer on Production Intelligence V4, a SaaS platform where factory owners get real-time insight into their production lines.",
    img: ProductionIntelligenceV4,
    url: "https://trivision.io/production-intelligence/",
    badge: "Big Data",
    year: "2025 - 2026",
  },
  {
    title: "Askov.dk",
    img: AskovPreview,
    desc: "A small static website made for my parents. Its main use is showing pictures of our cats and a link to a personal wishlist. Check out the pictures at the bottom, they are so cute.",
    url: "https://askov.dk",
    badge: "Website",
    year: "2023 - Now",
  },
  {
    title: "Hjemmet.net",
    img: HjemmetPreview,
    desc: "Hjemmet is a website for you and your family to create and share wishlists between each other. I used this project to learn how to do authentication from scratch.",
    url: "https://hjemmet.net",
    year: "2024",
    badge: "Fullstack",
  },
  {
    title: "BlenderBin",
    img: BlenderBinPreview,
    desc: "BlenderBin is an extension of BlenderProc made to easily create synthetic datasets with many augmentations for Bin Picking. This was part of my Bachelor thesis which has been used by others to improve the state of the art.",
    url: "https://github.com/hansaskov/BlenderBin",
    year: "2023 - 2024",
    badge: "AI",
  },
  {
    title: "hans.askov.dk",
    img: PersonalSitePreview,
    desc: "The site you are reading right now! It is a static site made with Astro.js and DaisyUI.",
    url: "/",
    year: "2023 - Now",
    target: "_self",
  },
  {
    title: "Extract Windows Key",
    img: ExtractWindowsKeyPreview,
    desc: "Are you tired of losing your Windows key? Worry not. This program will extract and save your Windows key in a CSV. Works well with a USB stick.",
    url: "https://github.com/hansaskov/extract-windows-key",
    year: "2023",
    badge: "Rust",
  },
];
