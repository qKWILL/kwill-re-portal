import { unstable_cache } from "next/cache";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { TAGS } from "@/lib/cache-tags";
import {
  SUBMISSION_TABS,
  type SubmissionTabKey,
} from "@/app/(portal)/submissions/tabs";

const ONE_HOUR = 60 * 60;
const FIVE_MINUTES = 5 * 60;
const ONE_MINUTE = 60;

// --- Properties ------------------------------------------------------------

export const getPropertiesList = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("properties")
      .select(
        "id, title, status, city, state, zip, featured, content, updated_at, created_by, property_media(url, display_order, media_type)",
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    return data ?? [];
  },
  ["portal-properties-list"],
  { tags: [TAGS.properties], revalidate: ONE_HOUR },
);

export const getPropertyById = unstable_cache(
  async (id: string) => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("properties")
      .select(
        "*, property_agents(role, team_member_id, team_members(id, name, role, img_url)), property_media(id, url, storage_path, display_order, caption, media_type, filename), property_spaces(id, name, size_sf, term, rental_rate, space_use, build_out, available_date, features, display_order)",
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    return data;
  },
  ["portal-property-by-id"],
  {
    tags: [TAGS.properties],
    revalidate: ONE_HOUR,
  },
);

export const getRecentActiveProperties = unstable_cache(
  async (limit: number = 3) => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("properties")
      .select(
        "id, title, city, state, updated_at, property_media(url, display_order, media_type)",
      )
      .eq("status", "active")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["portal-recent-active-properties"],
  { tags: [TAGS.properties], revalidate: ONE_HOUR },
);

// --- Posts -----------------------------------------------------------------

export const getPostsList = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, excerpt, type, status, img_url, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    return data ?? [];
  },
  ["portal-posts-list"],
  { tags: [TAGS.posts], revalidate: ONE_HOUR },
);

export const getPostById = unstable_cache(
  async (id: string) => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("posts")
      .select("*, team_members:author_id(id, name)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    return data;
  },
  ["portal-post-by-id"],
  { tags: [TAGS.posts], revalidate: ONE_HOUR },
);

export const getRecentPublishedPosts = unstable_cache(
  async (limit: number = 3) => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, img_url, type, updated_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["portal-recent-published-posts"],
  { tags: [TAGS.posts], revalidate: ONE_HOUR },
);

// --- Team ------------------------------------------------------------------

export const getTeamMembersList = unstable_cache(
  async () => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("team_members")
      .select("id, name, role, img_url, tags, user_id")
      .order("name");
    return data ?? [];
  },
  ["portal-team-list"],
  { tags: [TAGS.team], revalidate: ONE_HOUR },
);

export const getTeamMemberById = unstable_cache(
  async (id: string) => {
    const supabase = createCacheClient();
    const { data } = await supabase
      .from("team_members")
      .select("*, team_experience(id, company, role, display_order)")
      .eq("id", id)
      .single();
    return data;
  },
  ["portal-team-member-by-id"],
  { tags: [TAGS.team], revalidate: ONE_HOUR },
);

// --- Submissions ----------------------------------------------------------

export type SubmissionRow = {
  id: number;
  first_name: string;
  email: string;
  company_size: string;
  message: string;
  division: string | null;
  submission_type: string | null;
  property_id: string | null;
  property: { id: string; title: string | null } | null;
  created_at: string;
};

export const getSubmissionsList = unstable_cache(
  async (tabKey: SubmissionTabKey, propertyFilter: string | null) => {
    const tab = SUBMISSION_TABS.find((t) => t.key === tabKey);
    if (!tab) return [] as SubmissionRow[];
    const supabase = createCacheClient();
    let query = supabase
      .from("form_submissions")
      .select("*, property:properties(id, title)")
      .eq("submission_type", tab.submissionType)
      .order("created_at", { ascending: false });
    if (tab.division) query = query.eq("division", tab.division);
    if (propertyFilter) query = query.eq("property_id", propertyFilter);
    const { data } = await query;
    return (data ?? []) as SubmissionRow[];
  },
  ["portal-submissions-list"],
  { tags: [TAGS.submissions], revalidate: ONE_MINUTE },
);

export const getSubmissionTabCounts = unstable_cache(
  async (propertyFilter: string | null) => {
    const supabase = createCacheClient();
    const entries = await Promise.all(
      SUBMISSION_TABS.map(async (t) => {
        let countQuery = supabase
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("submission_type", t.submissionType);
        if (t.division) countQuery = countQuery.eq("division", t.division);
        if (propertyFilter)
          countQuery = countQuery.eq("property_id", propertyFilter);
        const { count } = await countQuery;
        return [t.key, count ?? 0] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<SubmissionTabKey, number>;
  },
  ["portal-submission-tab-counts"],
  { tags: [TAGS.submissions], revalidate: FIVE_MINUTES },
);

export const getBrochureDownloadCount = unstable_cache(
  async (propertyId: string) => {
    const supabase = createCacheClient();
    const { count } = await supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("submission_type", "brochure_download");
    return count ?? 0;
  },
  ["portal-brochure-download-count"],
  { tags: [TAGS.submissions], revalidate: FIVE_MINUTES },
);

// --- Dashboard ------------------------------------------------------------

export type DashboardSnapshot = {
  recentSubmissions: Array<
    Pick<
      SubmissionRow,
      | "id"
      | "first_name"
      | "email"
      | "message"
      | "division"
      | "submission_type"
      | "created_at"
    >
  >;
  propertyDrafts: Array<{
    id: string;
    title: string | null;
    status: string;
    updated_at: string;
  }>;
  postDrafts: Array<{
    id: string;
    title: string | null;
    type: string | null;
    updated_at: string;
  }>;
};

// Factory-wrapped because `unstable_cache`'s `tags` option is evaluated at
// wrap time, and we need a per-user tag (`TAGS.userDashboard(userId)`) so a
// save by user A doesn't bust user B's dashboard cache. The closure cost is
// negligible; `unstable_cache` still auto-keys on the userId argument.
export function getDashboardSnapshot(userId: string) {
  const fetcher = unstable_cache(
    async (uid: string): Promise<DashboardSnapshot> => {
      const supabase = createCacheClient();
      const [submissionsRes, propertyDraftsRes, postDraftsRes] =
        await Promise.all([
          supabase
            .from("form_submissions")
            .select(
              "id, first_name, email, message, division, submission_type, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("properties")
            .select("id, title, status, updated_at")
            .eq("created_by", uid)
            .neq("status", "active")
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("posts")
            .select("id, title, type, updated_at")
            .eq("created_by", uid)
            .eq("status", "draft")
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .limit(5),
        ]);
      return {
        recentSubmissions: submissionsRes.data ?? [],
        propertyDrafts: propertyDraftsRes.data ?? [],
        postDrafts: postDraftsRes.data ?? [],
      };
    },
    ["portal-dashboard-snapshot"],
    {
      tags: [TAGS.submissions, TAGS.userDashboard(userId)],
      revalidate: ONE_MINUTE,
    },
  );
  return fetcher(userId);
}
