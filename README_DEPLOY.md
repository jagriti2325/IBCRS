# Deployment Guide — IBCRS Frontend

This guide shows simple options to host the static frontend externally (Vercel, Netlify, GitHub Pages).

Notes:
- The frontend static files are in `website/frontend`.
- If you want the backend routes (/api/scan) to stay functional, keep the FastAPI backend running on a server and deploy only the frontend separately. If you want the backend to serve the same static files, copy the built frontend files into `server/static` (see step below).

Quick steps — push to GitHub and deploy with Vercel (recommended for static sites):

1. Create a GitHub repo and push the workspace (or at least the `website/frontend` folder).

```bash
# from project root
git init
git add .
git commit -m "Initial IBCRS frontend"
# create repo on GitHub and then:
git remote add origin git@github.com:<your-org-or-user>/<repo>.git
git push -u origin main
```

2. Deploy with Vercel (browser method) — simplest:
- Go to https://vercel.com, sign in with GitHub, and import the repo.
- For project root use `website/frontend` (if the repo contains multiple folders).
- Vercel will serve static HTML automatically.

3. Deploy with Vercel (CLI):

```bash
npm i -g vercel
cd website/frontend
vercel   # follow prompts; choose project scope and confirm
# When asked for "Which directory is the code located in?" choose '.'
```

4. Deploy with Netlify (alternative):
- Create a GitHub repo and connect it in Netlify.
- Set the publish directory to `website/frontend`.

5. GitHub Pages (simpler, but less flexible):
- Create a repository and push `website/frontend` contents to the `gh-pages` branch, or use GitHub Actions to publish the folder.

Copy to backend `server/static` (optional — to have FastAPI serve the same pages):

```bash
# from project root
rm -rf server/static/*
cp -r website/frontend/* server/static/
# restart FastAPI backend (if running as a service or via uvicorn)
```

Troubleshooting:
- If images or assets don't appear, make sure paths are relative and that `assets/` exists in the deployed directory.
- For API integration: if frontend is hosted on a different origin, configure CORS on the backend and update API endpoints in the frontend to point to the backend URL.

If you'd like, I can:
- Create a small GitHub Actions workflow to auto-deploy `website/frontend` to GitHub Pages.
- Copy the updated pages into `server/static` for the backend to serve (I can do that now).
- Run a local verification server and confirm pages render identically.
