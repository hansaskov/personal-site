# Hans Askov.dk | Personal Portfolio

This is the repository for my personal portfolio website it starteed from a template of [Astrofy](https://github.com/manuelernestog/astrofy)

## Demo

View a live demo [Hans Askov.dk](https://hans.askov.dk/)

## Installation

Run the following command in your terminal

```bash
pnpm install
```

Once the packages are installed you are ready to run Astro. Astro comes with a built-in development server that has everything you need for project development. The astro dev command will start the local development server so that you can see your new website in action for the very first time.

```bash
pnpm run dev
```

The PDF downloads (CVs and application letters) and the homepage preview image (`src/media/personal-site.webp`, used for the site's own project card) are generated automatically as part of the build. The `post-build-media` Astro integration prints every `/cv` and `/application-letter` page to PDF into `dist/` and captures the homepage preview when you run:

```bash
pnpm build
```

It uses a self-contained Chromium (`@sparticuz/chromium`), so it works locally and on Vercel without installing any system dependencies. The generated PDFs are never committed to git.

## Tech Stack

- [Astro](https://astro.build)
- [tailwindcss](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
