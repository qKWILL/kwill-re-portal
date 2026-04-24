"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/lib/cache-tags";

const draftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Post type is required"),
});

const publishSchemas: Record<string, z.ZodObject<any>> = {
  blog: z.object({
    title: z.string().min(1, "Title is required"),
    type: z.literal("blog"),
    img_url: z.string().min(1, "Featured image is required to publish"),
  }),
  // News requires excerpt + image. external_url OR content body is required —
  // enforced separately below so authors can publish full articles or link out.
  news: z.object({
    title: z.string().min(1, "Title is required"),
    type: z.literal("news"),
    excerpt: z.string().min(1, "Excerpt is required to publish"),
    img_url: z.string().min(1, "Featured image is required to publish"),
  }),
  linkedin: z.object({
    title: z.string().min(1, "Title is required"),
    type: z.literal("linkedin"),
    excerpt: z.string().min(1, "Excerpt is required to publish"),
    external_url: z.string().min(1, "External URL is required to publish"),
    img_url: z.string().min(1, "Featured image is required to publish"),
  }),
  podcast: z.object({
    title: z.string().min(1, "Title is required"),
    type: z.literal("podcast"),
    excerpt: z.string().min(1, "Excerpt is required to publish"),
    youtube_url: z.string().min(1, "YouTube URL is required to publish"),
    img_url: z.string().min(1, "Featured image is required to publish"),
  }),
};

function hasRichContent(content_json: any): boolean {
  if (!content_json?.content) return false;
  return content_json.content.some((node: any) => {
    if (node.text?.trim()) return true;
    if (Array.isArray(node.content)) {
      return node.content.some((c: any) => c.text?.trim() || c.content?.length);
    }
    return false;
  });
}

export type PostFormData = {
  id?: string;
  title: string;
  type: string;
  excerpt: string;
  external_url: string;
  youtube_url: string;
  img_url: string;
  author_id: string;
  content_json?: any;
  content_html?: string;
};

export type SavePostResult =
  | { success: true; id: string }
  | { success: false; errors: Record<string, string> };

function generateSlug(title: string) {
  return (
    (title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `post-${Date.now()}`) + `-${Date.now()}`
  );
}

export async function savePost(
  data: PostFormData,
  status: "draft" | "published",
): Promise<SavePostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Validate — any non-draft save uses publish-style rules
  const schema =
    status === "draft"
      ? draftSchema
      : (publishSchemas[data.type] ?? draftSchema);
  const parsed = schema.safeParse(data);
  const errors: Record<string, string> = {};

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      errors[issue.path[0] as string] = issue.message;
    });
  }

  // Blog: post body required to publish
  if (status !== "draft" && data.type === "blog") {
    if (!hasRichContent(data.content_json)) {
      errors.content = "Post body is required to publish";
    }
  }

  // News: either external_url OR a non-empty body
  if (status !== "draft" && data.type === "news") {
    const hasUrl = !!data.external_url?.trim();
    const hasBody = hasRichContent(data.content_json);
    if (!hasUrl && !hasBody) {
      errors.external_url =
        "Add an external URL or write a body to publish";
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const payload = {
    title: data.title,
    type: data.type,
    status,
    excerpt: data.excerpt || null,
    external_url: data.external_url || null,
    youtube_url: data.youtube_url || null,
    img_url: data.img_url || null,
    author_id: data.author_id || null,
    content_json: data.content_json ?? null,
    content_html: data.content_html ?? null,
    date: status === "published" ? new Date().toISOString() : null,
    slug: generateSlug(data.title),
  };

  let postId = data.id;

  if (data.id) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const isAdmin = roleRow?.role === "admin";

    const { data: before } = await supabase
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .single();

    if (!before) return { success: false, errors: { _: "Post not found" } };
    if (!isAdmin && before.created_by !== user.id)
      return { success: false, errors: { _: "Not authorized" } };

    const { error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", data.id);
    if (error) return { success: false, errors: { _: error.message } };
    const { data: after } = await supabase
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .single();
    await supabase.from("audit_log").insert({
      table_name: "posts",
      record_id: data.id,
      action: "update",
      before,
      after,
      performed_by: user.id,
    });
  } else {
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();
    if (error || !newPost)
      return {
        success: false,
        errors: { _: error?.message ?? "Failed to create post" },
      };
    postId = newPost.id;
    await supabase.from("audit_log").insert({
      table_name: "posts",
      record_id: newPost.id,
      action: "create",
      before: null,
      after: newPost,
      performed_by: user.id,
    });
  }

  // Webhook on publish
  if (status === "published") {
    const { data: config } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["revalidation_url", "webhook_secret"]);
    const configMap = Object.fromEntries(
      (config ?? []).map((r) => [r.key, r.value]),
    );
    if (configMap.revalidation_url && configMap.webhook_secret) {
      const body = JSON.stringify({
        event: "publish",
        table: "posts",
        record_id: postId,
        path: "/news",
        timestamp: new Date().toISOString(),
      });
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(configMap.webhook_secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        encoder.encode(body),
      );
      const sigHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await fetch(configMap.revalidation_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": sigHex,
        },
        body,
      }).catch(() => {});
    }
  }

  revalidateTag(TAGS.posts, 'max');
  if (postId) revalidateTag(TAGS.post(postId), 'max');
  revalidateTag(TAGS.userDashboard(user.id), 'max');

  return { success: true, id: postId! };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const isAdmin = roleRow?.role === "admin";

  const { data: before } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  const { error } = await supabase.rpc("soft_delete_post", {
    p_post_id: postId,
    p_user_id: user.id,
    p_is_admin: isAdmin,
  });

  if (!error) {
    await supabase.from("audit_log").insert({
      table_name: "posts",
      record_id: postId,
      action: "delete",
      before,
      after: null,
      performed_by: user.id,
    });
  }

  revalidateTag(TAGS.posts, 'max');
  revalidateTag(TAGS.post(postId), 'max');
  revalidateTag(TAGS.userDashboard(user.id), 'max');
  if (before?.created_by && before.created_by !== user.id) {
    revalidateTag(TAGS.userDashboard(before.created_by), 'max');
  }

  redirect("/posts");
}
