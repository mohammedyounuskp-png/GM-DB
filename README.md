# GM Sales Dashboard

Static dashboard (Month wise, Branch wise, Target vs achieved). Site files are in `public/`.

## Deploy on Vercel (once)
Import this repo in Vercel. `vercel.json` already sets the output folder to `public`; no build step.

## Update the data (automatic)
1. On GitHub open the `data` folder > Add file > Upload files > drop the new Excel (sheets `Sale Register` and `Target`). Commit.
2. A GitHub Action rebuilds `public/data.js` (about 1 minute) and commits it.
3. Vercel redeploys on that commit. Refresh the site.

Keep only one .xlsx in `data/` (the newest is used). Keep this repo **private**: the workbook contains customer names. The workbook sits outside `public/`, so the website does not serve it.
Check the run under the repo's Actions tab if the site does not change.

## Manual option
`npm install` then `npm run build-data -- path/to/file.xlsx` rewrites `public/data.js`.
