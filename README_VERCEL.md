# Aditya Nugroho — Vercel Portfolio

Static HTML/CSS/JavaScript version of the Streamlit portfolio.

## Folder structure

```text
portfolio/
├── index.html
├── style.css
├── script.js
├── site-data.json
├── projects.json
├── assets/
│   ├── profile.jpg
│   ├── cv.pdf
│   ├── ijazah.pdf
│   └── transkrip_nilai.pdf
├── projects/
│   └── ...
└── certificates/
    └── ...
```

## Important

The browser cannot automatically scan folders the way Python can with `Path.iterdir()`.
Therefore `projects.json` is used as a small static manifest.

For each project, add:

```json
{
  "title": "Project Title",
  "category": "Data Analysis",
  "description": "Project description",
  "images": [
    "projects/project-folder/images/1.png",
    "projects/project-folder/images/2.png"
  ],
  "demo": "https://example.com",
  "github": "https://github.com/..."
}
```

Certificates use:

```json
{
  "title": "Certificate Name",
  "src": "certificates/certificate.png"
}
```

## Features

- One long-scroll portfolio page
- Sidebar navigation remains visible on desktop
- Mobile hamburger navigation
- Active menu updates while scrolling
- Profile photo has NO zoom
- Other images open in a popup viewer
- Mouse wheel zoom
- Double-click zoom
- Drag/pan after zoom
- Touch/pinch zoom on mobile
- Previous/Next image navigation
- Keyboard arrows and Escape
- PDF preview/download through normal browser links
- No Streamlit
- No Python runtime
- No database required

## Deploy to Vercel

1. Put this folder in your GitHub repository.
2. Push the complete folder structure.
3. In Vercel choose **Add New → Project**.
4. Import the GitHub repository.
5. Framework preset: **Other**.
6. Build command: leave empty.
7. Output directory: leave empty.
8. Deploy.

If your repository root already contains `index.html`, Vercel can serve it as a static site.

## Important for GitHub

File and folder names are case-sensitive after deployment. Keep paths exactly the same, for example:

`assets/profile.jpg`

is different from:

`assets/Profile.jpg`
