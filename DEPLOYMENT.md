# Cloudflare Pages deployment

Production project: `artemis-common-ground`.
Production URL: https://artemis-common-ground.pages.dev/
Source of releases: https://github.com/LumosLab-Innovation/nasa-space-apps-2026 (`main`).

This Pages project uses Direct Upload. Cloudflare does not support changing an existing Direct Upload project to native Git integration. Keep the existing project and URL; deploy checked builds from this repository using Wrangler, locally or from GitHub Actions.

## Local release

```sh
npm ci
npm test -- --maxWorkers=1
npm run build
wrangler pages deploy dist --project-name=artemis-common-ground --branch=main
```

The deployment should identify the actual source commit. Never change Git author dates to imply a different development period.

## GitHub Actions

`.github/workflows/pages.yml` builds and tests `main` and supports manual deployment. Configure `CLOUDFLARE_ACCOUNT_ID` as a repository variable and `CLOUDFLARE_API_TOKEN` as a repository secret with access limited to the required Cloudflare account and Pages editing. Set `CLOUDFLARE_DEPLOY_ENABLED` to `true` after the token is configured. Until then, the workflow runs validation without claiming to deploy.

No Cloudflare token is committed. A successful manual Wrangler upload does not imply that GitHub automatic deployment credentials have been configured.

Reference: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
