export interface Project {
  title: string;
  img: ImageMetadata | Promise<ImageMetadata>;
  desc: string;
  url: string;
  badge?: string;
  target?: string;
}

import AskovPreview from "../media/askov.webp";
import HjemmetPreview from "../media/hjemmet.webp";
import BlenderBinPreview from "../media/blenderbin.webp";
import PersonalSitePreview from "../media/personal-site.webp";
import ExtractWindowsKeyPreview from "../media/post_img.webp";

export const projects: Project[] = [
  {
    title: "Askov.dk",
    img: AskovPreview,
    desc: "A small static website made for my parents. It's main use is showing pictures of our cats and a link to a personal wishlist. Check out the pictures at the bottom, they are so cute.",
    url: "https://askov.dk",
    badge: "Website",
  },
  {
    title: "Hjemmet.net",
    img: HjemmetPreview,
    desc: "Hjemmet is a website for you and your family to create and share wishlists between each other. Go take a look and go through the authentication flow, but keep in mind that it is still under development",
    url: "https://hjemmet.net",
    badge: "FULLSTACK",
  },
  {
    title: "BlenderBin",
    img: BlenderBinPreview,
    desc: "BlenderBin is an extention of BlenderProc made to easily create a synthetic datasets with many augmentations for Bin Picking. This was part of my Bachlor thesis which has been used by others to improve the state of the art.",
    url: "https://github.com/hansaskov/BlenderBin",
    badge: "AI",
  },
  {
    title: "Personal website",
    img: PersonalSitePreview,
    desc: "The site you are reading right now! It is a static site made with Astro.js and DaisyUI.",
    url: "/",
    target: "_self",
  },
  {
    title: "Extract Windows Key",
    img: ExtractWindowsKeyPreview,
    desc: "Are you tired of losing your windows key? Worry not. This program will extract and save your windows key in a CSV. Works well with a USB stick",
    url: "https://github.com/hansaskov/extract-windows-key",
    badge: "RUST",
  },
];
