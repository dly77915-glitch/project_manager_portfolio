# Deploy to GitHub Pages — branch mode

Repository expected by `_config.yml`:

- Owner: `dly77915-glitch`
- Repository: `project_manager_portfolio`
- Published URL: `https://dly77915-glitch.github.io/project_manager_portfolio/`

## Required repository structure

Upload the **contents of this folder directly to the repository root**. `index.html` and `_config.yml` must be visible at the top level of the `main` branch. Do not upload the outer ZIP folder as a nested directory.

## GitHub settings

Open **Settings → Pages** and choose:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

Then save and push a new commit.

## Required personal files

Copy these existing files to the repository root:

- `cv.pdf`
- `my-photo.jpg`

The site can build without them, but CV/image links will be unavailable until they are added.

## Important

- Do not add a `.nojekyll` file. This site relies on Jekyll to process `_layouts`, `_includes`, `_projects`, Liquid filters, and front matter.
- Do not select `/docs` as the Pages source unless the whole website is moved into a root-level `docs` folder.
- Keep the repository name exactly `project_manager_portfolio`. If it changes, update `baseurl` in `_config.yml` to `/<new-repository-name>`.
