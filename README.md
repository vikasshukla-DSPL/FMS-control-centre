# Dynemech FMS Control Centre

React + Vite dashboard for Dynemech Systems Pvt Ltd, with a separate **MIS admin panel** at `/admin`.

- **Dashboard**: banner, KPIs, status donut, department chart, scorecard, list of FMS that still need a link
- **FMS registry**: search, department and status filters, sortable table, one-click FMS/SOP links, CSV export
- **Company and products**: about, applications, product families (tabbed)
- **MIS admin panel** (`/admin`, its own login): the MIS team edits everything above without touching code

## Run locally (VS Code)

```bash
npm install
npm run dev
```

- Dashboard: http://localhost:5173
- Admin panel: http://localhost:5173/admin

Locally you can sign in with **admin / admin123** (this shortcut only works on your computer, never on Vercel). Saves go to a file in `.data/`, which is git-ignored.

## The MIS admin panel

Sign in at `/admin`. Sections:

| Section | What the MIS team can do |
|---|---|
| Overview | See totals, FMS that still need links, and a go-live checklist |
| FMS registry | Add, edit, delete FMS; fix SOP and FMS links; change department; search and filter |
| Departments | Rename a department everywhere, or merge two |
| Company | Announcement strip (on/off + text), name, location, quote link, logo link, about text, roles, machines |
| Products | Add, edit, delete and reorder product families and products |
| Page text | Headings, quote box text, product note and footer note on the public pages |
| Backup and activity | Download a backup, restore one, export CSV, reset to the original data, see who changed what |

How editing works: changes are held as a draft. A bar at the bottom says "You have unsaved changes". **Nothing goes live until someone presses Save changes**, and Discard throws the draft away. If two people edit at once, the second to save is told to reload first, so nobody silently overwrites a colleague.

## Set up the admin panel on Vercel (one time)

The public site is static, so edits need somewhere to be stored. This uses a free Upstash Redis database from the Vercel Marketplace.

**Step 1. Deploy** as described below (GitHub, then Vercel).

**Step 2. Add storage.** In the Vercel project open **Storage**, choose **Upstash Redis** (Marketplace), create the database (free plan is plenty) and connect it to this project. Vercel adds the connection variables (`KV_REST_API_URL` and `KV_REST_API_TOKEN`, or the `UPSTASH_REDIS_REST_*` pair) automatically. The code accepts either.

**Step 3. Add the logins.** In **Settings > Environment Variables** add:

| Name | Value |
|---|---|
| `ADMIN_USERS` | `name:password` pairs separated by commas, for example `mis.head:Str0ng-pass-1,mis.exec:Another-pass-2`. Do not use a comma inside a password. |
| `ADMIN_SECRET` | A long random string (32+ characters). Make one with `openssl rand -hex 32`. It signs the login cookies. |

**Step 4. Redeploy** (Deployments > the latest one > Redeploy). Environment variable changes only apply to new deployments.

**Step 5.** Open `https://<your-site>/admin` and sign in. The Overview page warns you if storage is not connected.

To add, remove or change a login later, edit `ADMIN_USERS` and redeploy. A removed user is signed out immediately. See `.env.example` for a template.

### Important: where the data lives now

- Before the first save, the site shows the data bundled in `src/data/fms.json` and `src/data/company.js`.
- The first time someone presses **Save changes**, the full data (bundled data plus their edits) is stored in the database. **From then on the database wins**, and editing `fms.json` no longer changes the live site.
- The bundled files stay as the starting point and as a safety net: if the database is unreachable, visitors still see the bundled data instead of a blank page.
- Use **Backup and activity > Download backup** regularly. Restoring a backup loads it into the draft so you can review it before saving.

### Security notes

- Passwords are checked on the server and are never sent to the browser. Login sessions are signed, `httpOnly`, `SameSite=Strict` cookies that last 12 hours.
- Eight wrong passwords from one address locks logins from it for 15 minutes.
- The server re-checks everything that is saved. Links must be `http://` or `https://`, text lengths are capped, and unknown fields are dropped.
- Only logged-in MIS users can change data. The public dashboard can only read it.
- Use strong, unique passwords and give each person their own login so the activity log is meaningful.

## Push to GitHub

```bash
git init
git add .
git commit -m "Dynemech FMS dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/dynemech-fms-dashboard.git
git push -u origin main
```

## Deploy on Vercel

1. Go to vercel.com, then Add New > Project, and import the GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
3. Click Deploy, then do the admin setup above.

`vercel.json` handles page refreshes on `/registry`, `/company` and `/admin`. Every later `git push` redeploys automatically.

## Folder map

```
api/                   Server functions (run on Vercel, and inside npm run dev)
  login.js logout.js session.js   MIS sign in / out / who am I
  data.js              public read, MIS-only save
  audit.js             activity log
  _lib/                auth, storage, validation, activity summaries
src/
  App.jsx              routes (admin is loaded as a separate bundle)
  context/DataContext  loads the saved data for the public site
  components/          Header, Hero (banner), Footer, StatusBadge
  pages/               Overview, Registry, Company (public)
  admin/               login, shell, and one page per admin section
  data/                fms.json, company.js, defaults.js (bundled starting data)
  utils/               metrics.js, exportCsv.js, api.js, url.js
  styles/global.css    colours, fonts, shared layout
```
