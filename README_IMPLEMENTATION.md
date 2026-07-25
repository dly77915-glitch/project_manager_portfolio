# Digital Project Manager Portfolio — Home implementation

This package contains code mapped to the folder structure shown in the conversation.

## Replace / merge these files

- `_config.yml`
- `_layouts/default.html`
- `_layouts/project.html`
- `_includes/header.html`
- `_includes/footer.html`
- `_includes/components/hero-video.html`
- `_includes/components/drawer.html`
- `index.html`
- `assets/css/style.css`
- `assets/js/main.js`

## Keep your existing personal assets

The code expects these files to remain at the project root:

- `cv.pdf`
- `my-photo.jpg` (not displayed yet; reserved for a future image decision)

## Important placeholders

1. The three activity drawer stories intentionally contain placeholder copy because exact activity details were not provided.
2. Story-card visuals are CSS placeholders so the UI works before final images are selected.
3. Project markdown files are safe placeholder pages. Replace their body with the final case studies later.
4. `_config.yml` currently uses:
   - GitHub user: `dly77915-glitch`
   - repository/baseurl: `/project_manager_portfolio`
   Change `baseurl` only if the final repository name differs.

## Local preview

Use your normal Jekyll preview command. GitHub Pages will build the Liquid filters and project collection when deployed from the configured branch.
