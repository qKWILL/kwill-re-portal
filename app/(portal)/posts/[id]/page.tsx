import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import DeletePostButton from "./delete-post-button";
import PostStatusButton from "./post-status-button";

const TYPE_COLORS: Record<string, string> = {
  blog: "bg-blue-100 text-blue-700",
  news: "bg-orange-100 text-orange-700",
  podcast: "bg-green-100 text-green-700",
  linkedin: "bg-sky-100 text-sky-700",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: post } = await supabase
    .from("posts")
    .select("*, team_members:author_id(name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!post) notFound();

  const isOwner = post.created_by === user.id;
  const canDelete = isAdmin || (isOwner && post.status === "draft");
  const canChangeStatus = isAdmin || isOwner;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/posts"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Posts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {post.title || "Untitled"}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[post.type] ?? "bg-gray-100 text-gray-600"}`}
            >
              {post.type}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[post.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {post.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {canChangeStatus && (
            <PostStatusButton postId={id} currentStatus={post.status} />
          )}
          <Link
            href={`/posts/${id}/edit`}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <DeletePostButton postId={id} canDelete={canDelete} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {post.img_url && (
          <div className="p-5">
            <img
              src={post.img_url}
              alt={post.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        {post.excerpt && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Excerpt</p>
            <p className="text-sm text-gray-800">{post.excerpt}</p>
          </div>
        )}
        {post.external_url && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">URL</p>
            <a
              href={post.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {post.external_url}
            </a>
          </div>
        )}
        {post.youtube_url && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">
              YouTube URL
            </p>
            <a
              href={post.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {post.youtube_url}
            </a>
          </div>
        )}
        {post.content_html && (
          <div className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Content</p>
            <div
              className="prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content_html) }}
            />
          </div>
        )}
        <div className="p-5 grid grid-cols-2 gap-4">
          {post.team_members?.name && (
            <div>
              <p className="text-xs text-gray-500">Author</p>
              <p className="text-sm font-medium text-gray-900">
                {post.team_members.name}
              </p>
            </div>
          )}
          {post.date && (
            <div>
              <p className="text-xs text-gray-500">Published</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(post.date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Last updated {new Date(post.updated_at).toLocaleString()}
      </p>
    </div>
  );
}
