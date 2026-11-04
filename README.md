# GM Sales Dashboard

Static dashboard (Month wise, Branch wise, Target vs achieved). No build step.

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: Add New > Project > import the repo.
3. Framework preset: **Other**. Build command: empty. Output directory: `.` (root). Deploy.

## Updating the data
- **Quick, per browser:** open the site, click **Update data**, upload the new workbook (sheets `Sale Register` and `Target`). Saved in that browser only.
- **For everyone:** `npm install`, then `npm run build-data -- path/to/GM_DB.xlsx`, commit `data.js` and push. Vercel redeploys.

Do not commit the Excel file (it holds customer details); `.gitignore` excludes `*.xlsx`.
