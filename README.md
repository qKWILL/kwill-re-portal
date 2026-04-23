# KWILL Merchant Advisors — CMS Portal

Internal content management portal for KWILL Merchant Advisors. Built with Next.js 16 App Router and Supabase.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database / Auth:** Supabase (Postgres + RLS)
- **Styling:** Tailwind CSS v4
- **Rich text:** Tiptap
- **Maps:** Google Maps (`@vis.gl/react-google-maps`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API key (browser — map view) |
| `GOOGLE_MAPS_KEY` | Google Maps API key (server-only — geocoding on property save) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (migration script only — never expose publicly) |

> `GOOGLE_MAPS_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_KEY` can point to the same key. Keeping them separate means the geocoding key is never included in the browser bundle.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roles

| Role | Capabilities |
|---|---|
| `admin` | Full access — create, edit, publish, delete, view submissions, manage portal access |
| `editor` | Create, edit, publish own content. Cannot delete. Cannot view submissions. Cannot edit other users' content. |

Roles are stored in the `user_roles` table and enforced both in server actions and via Supabase RLS policies.

### Super-admin

`qmorton@kwilladvisors.com` is a hardcoded super-admin. Only the super-admin can:

- Create a new user directly as `admin`
- Change an existing admin's role (demote to editor)
- Unlink an admin's team profile

Any admin can invite editors and promote editors to admin.

## Adding users

Authentication is passwordless. To add someone:

1. Go to **Access** in the sidebar (admin only) or open a team member's profile.
2. Enter their email, pick a role, optionally link to a team profile, and submit.
3. The user can now sign in from `/login` — they'll receive a magic link by email.

We never store passwords and the Supabase "invite user" email is not used. The account is provisioned silently via the admin API (`SUPABASE_SERVICE_ROLE_KEY` must be set in the runtime environment).

## Scripts

One-time utility scripts live in the `scripts/` directory. They use `tsx` and connect directly to Supabase via the service role key.

### `scripts/migrate-news-posts.ts` — Legacy data migration

Migrates rows from the legacy `news_posts` table into the new `posts` table.

**Do not run this until:**
- The portal is live and the `posts` schema is finalised
- You have taken a manual database backup
- You have completed the manual step below

**Manual step required before running:**

The script needs Franklin Eruo's `team_members.id` hardcoded at the top — there is no slug column in `team_members` to match programmatically. Find it with:

```sql
SELECT id, name FROM team_members WHERE name ILIKE '%franklin%';
```

Then open `scripts/migrate-news-posts.ts` and set:

```ts
const FRANKLIN_ID = 'paste-uuid-here'
```

**Also required:** `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local`.

**Run:**

```bash
npx tsx scripts/migrate-news-posts.ts
```

**Column mapping:**

| `news_posts` | `posts` |
|---|---|
| `title` | `title` |
| `excerpt` | `excerpt` |
| `img_url` | `img_url` |
| `type` | `type` |
| `date` | `date` |
| `link` | `external_url` |
| `youtubeUrl` | `youtube_url` |
| `author` (Franklin only) | `author_id` (hardcoded UUID) |

Blog rows with a plain-text `content` field are wrapped in a Tiptap paragraph doc and written to `content_json` / `content_html`. All migrated rows are inserted with `status: 'published'` and `created_by: null` to distinguish them from portal-created posts.

**After verifying results:** update the marketing site to read from `posts`. Keep `news_posts` as a read-only archive — do not drop it.
