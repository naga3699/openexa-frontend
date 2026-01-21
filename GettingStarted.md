# Setup & Build

Follow these steps to set up the project locally, install dependencies, and build for production.

## Clone

```bash
git clone https://github.com/naga3699/openexa-frontend.git
cd FrontEnd
```

## Install dependencies

Choose one of the flows below (do not mix `npm` and `yarn` installs):

### Using npm (recommended)

```bash
npm ci          # clean install (faster/reproducible)
npm run build   # build production bundle into ./dist
npm run preview # optional, preview production build locally
```

### Using yarn

```bash
yarn install
yarn build
yarn preview
```

## Development (hot reload)

```bash
npm run dev
# or
yarn dev
```

## Notes

- You historically ran: `npm install`, `npm ci`, `yarn`, `npm run build`, `npm run dev`. That mix is unnecessary; pick either `npm` or `yarn`.
- `npm ci` is preferred in CI and when `package-lock.json` is present.
- Vite outputs the production build to the `dist` folder by default.
- For Azure Static Web Apps (SWA):
  - Letting Azure build uses Oryx. Oryx selects Node from `engines.node` in `package.json` or an `.nvmrc` file — add one to force Node >= 22.
  - Or build locally in CI and upload the prebuilt `dist` to avoid server-side builds.

## Do NOT check in node_modules

- `node_modules` can be very large and should not be committed to the repository. Ensure your repository has `node_modules/` listed in `.gitignore`.

If `node_modules` was accidentally committed, remove it from the repo history and keep it ignored:

```bash
# Add node_modules to .gitignore
echo "node_modules/" >> .gitignore

# Remove from git index (keeps files locally)
git rm -r --cached node_modules
git commit -m "chore: remove node_modules from repo and gitignore it"
git push
```

Notes:
- Use `npm ci` or `yarn install` to regenerate `node_modules` from `package.json` + lockfile.
- Committing the lockfile (`package-lock.json` or `yarn.lock`) ensures reproducible installs in CI.

## Quick commit example

```bash
git add .
git commit -m "commit message"
git push
```
