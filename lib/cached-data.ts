import { unstable_cache } from "next/cache";
import { createCacheClient } from "@/lib/supabase/cache-client";
import { TAGS } from "@/lib/cache-tags";

const ONE_HOUR = 60 * 60;

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
