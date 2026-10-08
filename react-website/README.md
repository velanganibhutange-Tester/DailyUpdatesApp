# Daily Updates React Website

This is a standalone React website. It does not require ASP.NET, SQL Server, or a backend. The existing C# application remains separate and functional.

## Run

Install Node.js, then run these commands in this directory:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite. Add a local profile, create updates, or load optional sample records. All stored profiles and updates can be edited by anyone using the same browser; these profiles are not authenticated accounts.

## Data

Data is saved in localStorage under `daily-updates-react-v1`, separately for each browser and website origin. The local C# application's database is not imported or modified. Clearing browser storage removes these records. Use Backup to download a JSON file and Import to restore it. Import replaces the current profile and records only after confirmation. CSV exports include the visible filtered records.

Changes in another tab refresh this workspace. An unreadable or invalid saved dataset is not silently overwritten. Storage failures are shown and do not claim that a record was saved.

## Build and Publish

```powershell
npm run build
```

The `dist` directory contains static HTML, JavaScript, CSS, and the logo. Upload its contents to a static host such as GitHub Pages or Cloudflare Pages. For an automated static deployment, set the project root to `react-website`, the build command to `npm run build`, and the output directory to `dist`.

The relative asset base supports publishing under a repository subdirectory. Navigation uses URL hashes, so it does not require server route rewrites. Hosting can make the website public, but visitors do not share data with each other. A backend would be required for shared updates and secure employee accounts.

Browser data created on localhost is separate from data on the published URL. Export/import a backup to transfer records. Render the built site through a static web server; opening `dist/index.html` directly as a file is not supported by Vite's JavaScript module output.

## GitHub Pages for This Repository

The workflow at `.github/workflows/react-pages.yml` installs dependencies, runs the storage tests, builds this React website, and deploys only `react-website/dist`. It builds with the repository name as the URL base. No ASP.NET server or SQL database is deployed.

1. Open `https://github.com/velangani-max/DailyUpdatesApp/settings/pages` while signed in as the repository owner.
2. Under Build and deployment, select GitHub Actions as the Source.
3. From the repository root, stage only `.github/workflows/react-pages.yml` and `react-website`, commit, and push to `main`.
4. In GitHub's Actions tab, open Deploy React Website to GitHub Pages and check that build and deploy finish successfully. If necessary, select Run workflow on main.
5. The expected website address is `https://velangani-max.github.io/DailyUpdatesApp/` after the first successful deployment.

GitHub Pages on GitHub Free requires a public repository. If the existing repository is private and you want to keep it private, use a separate public repository containing only this website, or choose another static host. Do not change repository visibility just to deploy without reviewing the source first.

Only the website source and deployment workflow are needed for Pages. Do not stage `bin`, `obj`, `outputs`, `node_modules`, or `.npm-cache`. The workflow publishes changes to the React website when pushed to main, and can also be run manually. No personal browser records are included in the build. Each visitor's localStorage remains independent.

References: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Vite deployment guide](https://vite.dev/guide/static-deploy.html).
