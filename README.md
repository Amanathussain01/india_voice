# India Voice - Next.js + React Dashboard + Express

This project contains:

- `site/` - the public Next.js news website
- `dashboard/` - the React JSX admin dashboard
- `server/` - the Express API and JSON demo database

## Demo backend data

The backend contains **100 published dummy news articles** plus the existing workflow records. The 100 published records use the same main categories as the Next.js navigation:

- देश (17)
- दुनिया (9)
- राजनीति (9)
- बिज़नेस (9)
- तकनीक (8)
- खेल (8)
- ऑटो (8)
- मनोरंजन (8)
- एस्ट्रोलॉजी (8)
- जीवन मंत्रा (8)
- जरा हटके (8)

The dummy articles are explicitly marked as test/demo content inside their article body and are not intended to represent real reporting.

## Data flow

`dashboard -> Express -> server/data/db.json -> Next.js`

Only posts with `status: published` and non-private visibility are returned by the public API.

### Public API

- `GET /api/public/posts`
- `GET /api/public/posts?category=बिज़नेस`
- `GET /api/public/posts?search=...`
- `GET /api/public/posts/:slug`
- `GET /api/public/categories`

### Dashboard post filtering

The dashboard All Posts screen can filter by status and category and search the backend data. Published News can be viewed category-wise.

## Local URLs

- Next.js site: `http://localhost:3000`
- React dashboard: `http://localhost:5173/login`
- Express API: `http://localhost:5013`

Set `BACKEND_URL=http://localhost:5013` for the Next.js server if the backend is not running at the default address.


## Public contributor signup and news submission

The public Next.js website now includes:

- `/signup` - create a contributor account with name, email, and password
- `/login` - login using the registered email and password
- `/post-news` - available only after login; submit area/location, title, category, description, and an image upload

New public signups are assigned the `reporter` role. Submissions from `/post-news` are always saved as `pending` and cannot publish themselves. They appear in the React dashboard under **Posts → All Posts → Pending**. A Super Admin can approve/publish the story; only then will it be returned by the public Next.js API and appear on the website.

Admin-added reporter accounts receive a unique `IVR-0001`-style Reporter ID. Existing admin-added reporter accounts are assigned IDs automatically when the API reads the database, and newly added reporters receive the next ID. Public contributor accounts are labeled Reporter and do not receive or display a Reporter ID. IDs are shown in Account Management under Reporters.

When adding a reporter in Account Management, Super Admins can assign one of three access levels: **Read + Edit + Publish**, **View everything only**, or **Add posts → approval**. The account keeps its Reporter role and Reporter ID. All reporters can see every news post, but news editing, publishing, and deletion are restricted to Super Admins. View-only access is enforced by the API, not just hidden in the dashboard.

Images are uploaded to `server/uploads/` (created automatically) and served by Express at `/uploads/...`. Accepted types are JPG, PNG, WEBP, and GIF, with a 5 MB limit.

### Start locally

Run each app in a separate terminal:

```bash
cd server
npm install
npm run dev
```

```bash
cd dashboard
npm install
npm run dev
```

```bash
cd site
npm install
npm run dev
```

Open the website at `http://localhost:3000`, dashboard at `http://localhost:5173/login`, and API health at `http://localhost:5013/api/health`.

For deployment, set `PUBLIC_BACKEND_URL` in the server environment to the public Express API origin (for example `https://api.example.com`) so uploaded images get absolute URLs the website can load. Set `NEXT_PUBLIC_BACKEND_URL` in the Next.js environment to that same API origin. Do not use the localhost defaults in production.
