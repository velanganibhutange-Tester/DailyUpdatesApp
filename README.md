# Daily Updates

A React website for tracking daily work, project tickets, progress, and blockers.

## Live Website

[Open Daily Updates](https://velanganibhutange-tester.github.io/DailyUpdatesApp/)

## Features

- Add, edit, view, and delete daily updates.
- Track features, ticket numbers, descriptions, and status.
- Record estimated time, ETA changes, and blockers.
- View personal updates, team summaries, and employee history.
- Search updates and filter by status or date.
- Export filtered records as CSV.
- Back up and restore records using JSON files.
- Responsive layout for desktop and mobile.
- Browser-only account registration and login.

## Technology

React, Vite, JavaScript, CSS, Lucide icons, and GitHub Pages.

## Data and Privacy

Records are stored locally in each visitor's browser. They are not shared across users, devices, or browsers.

Login and registration are local convenience features, not secure access control. Anyone with access to the browser can access its records. There is no email password reset or connection to the original application's SQL database.

Clearing browser storage removes local records and accounts. Export backups regularly and avoid storing confidential information.

## Run Locally

Requires Node.js 24.

From the repository root:

    cd react-website
    npm install
    npm run dev

Open the address printed in the terminal.

## Validate and Build

From the `react-website` directory:

    npm test
    npm run build

The production website is generated in `dist`.

## Deployment

The website is hosted on GitHub Pages. Changes become visible on the live website after they are pushed to the deployment branch and the GitHub Actions deployment completes.

## Original Application

The original ASP.NET application remains separate. This standalone website does not require an ASP.NET server or SQL Server.
