# Daily Updates React Website

This is a standalone React website. It does not require ASP.NET, SQL Server, or a backend. The existing C# application remains separate and functional.

## Open Website

[Open Daily Updates Website](https://velanganibhutange-tester.github.io/DailyUpdatesApp/)

This is the public GitHub Pages website. Anyone can open it in a browser without running a development server. Local changes appear there only after a successful deployment.

For development on this computer: [Local Preview](http://127.0.0.1:5173/#home).

## Run

Install Node.js, then run these commands in this directory:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite. The website follows the C# application's horizontal navigation and main workflows: Home, Add Update, My Updates, Team Dashboard, employee-specific updates, full-page Edit and Details, and Login/Register. All five original statuses, ETA fields, ETA change reasons and blockers are available. Existing browser records are preserved.

Use a local profile or register a browser-only account. Login selects that account's name/department; My Updates filters by the selected name, not an authorization rule. Accounts use email, password and confirmation, with password visibility controls. Passwords are salted and hashed with Web Crypto PBKDF2-SHA256 (600,000 iterations); plaintext passwords are not stored. These are local convenience accounts, not secure authentication. Anyone with access to the browser can view/change all records or alter storage. Team Dashboard is available without manager-role enforcement. Do not store confidential work or reuse a real password.

## Data

Data is saved in localStorage under `daily-updates-react-v1`, separately for each browser and website origin. The local C# application's database is not imported or modified. Clearing browser storage removes these records. Use Backup to download a JSON file and Import to restore it. Import replaces the current profile and records only after confirmation. CSV exports include the visible filtered records.

Changes in another tab refresh this workspace. An unreadable or invalid saved dataset is not silently overwritten. Storage failures are shown and do not claim that a record was saved.

Local account credentials are stored separately under `daily-updates-local-accounts-v1` and are not included in record backups. The login preference lasts for the tab's session and survives reload. Logging out clears that preference and selected profile, not updates. Clearing browser storage removes local accounts as well as records. There is no email verification, password-reset email, shared database, or server-side role security. Register again on another browser/origin with a unique password; importing updates does not import accounts. HTTPS (or localhost) is required for local password hashing.

If another tab changes records while Add/Edit is open, the stale form is closed rather than saving over newer data.

## Validation

`npm test` covers record storage, backup validation, CSV safety, and local account registration/login/storage failures. `npm run build` creates the production bundle. `node tests/browser-check.mjs` runs Playwright against the built bundle served under a repository subdirectory, covering page navigation, CRUD, account screens, backup/restore, cross-tab synchronization, storage failures and 320/390px mobile layouts. Install Playwright separately for browser checks, or set `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` to an existing installation. `WEBSITE_URL` can target an existing dev server instead.

## Build and Publish

```powershell
npm run build
```

The `dist` directory contains static HTML, JavaScript, CSS, and the logo. Upload its contents to a static host such as GitHub Pages or Cloudflare Pages. For an automated static deployment, set the project root to `react-website`, the build command to `npm run build`, and the output directory to `dist`.

The relative asset base supports publishing under a repository subdirectory. Navigation uses URL hashes, so it does not require server route rewrites. Hosting can make the website public, but visitors do not share data with each other. A backend would be required for shared updates and secure employee accounts.

Browser data created on localhost is separate from data on the published URL. Export/import a backup to transfer records. Render the built site through a static web server; opening `dist/index.html` directly as a file is not supported by Vite's JavaScript module output.

## GitHub Pages for This Repository

The workflow at `.github/workflows/react-pages.yml` installs dependencies, runs the storage tests, builds this React website, and deploys only `react-website/dist`. It builds with the repository name as the URL base. No ASP.NET server or SQL database is deployed.

1. Open `https://github.com/velanganibhutange-Tester/DailyUpdatesApp/settings/pages` while signed in as the repository owner.
2. Under Build and deployment, select GitHub Actions as the Source.
3. From the repository root, stage only `.github/workflows/react-pages.yml` and `react-website`, commit, and push to `main`.
4. In GitHub's Actions tab, open Deploy React Website to GitHub Pages and check that build and deploy finish successfully. If necessary, select Run workflow on main.
5. Open [Daily Updates Website](https://velanganibhutange-tester.github.io/DailyUpdatesApp/) after deployment succeeds.

The local checkout may still point to `velangani-max/DailyUpdatesApp`. Check `git remote -v` before pushing; pushing to a different repository does not update the public site above.

GitHub Pages on GitHub Free requires a public repository. If the existing repository is private and you want to keep it private, use a separate public repository containing only this website, or choose another static host. Do not change repository visibility just to deploy without reviewing the source first.

Only the website source and deployment workflow are needed for Pages. Do not stage `bin`, `obj`, `outputs`, `node_modules`, or `.npm-cache`. The workflow publishes changes to the React website when pushed to main, and can also be run manually. No personal browser records are included in the build. Each visitor's localStorage remains independent.

References: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Vite deployment guide](https://vite.dev/guide/static-deploy.html).
