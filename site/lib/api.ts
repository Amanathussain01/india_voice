import type { NewsItem } from "./data";

export type BackendPost = NewsItem & {
  slug: string;
  summary: string;
  content: string;
  categories: string[];
  tags: string[];
  authorId: string;
  authorName: string;
  areaName?: string;
  status: "draft" | "pending" | "published";
  visibility: "public" | "private";
  excludeFromGoogleNews: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5013";

async function request<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // The public site still works with its local fallback data if the API is down.
    return null;
  }
}

export async function getPublishedPosts(options?: { category?: string; search?: string }): Promise<BackendPost[]> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.search) params.set("search", options.search);
  const query = params.toString();
  const data = await request<{ posts: BackendPost[] }>(`/api/public/posts${query ? `?${query}` : ""}`);
  return data?.posts ?? [];
}

export async function getPublishedCategories(): Promise<{ name: string; count: number }[]> {
  const data = await request<{ categories: { name: string; count: number }[] }>("/api/public/categories");
  return data?.categories ?? [];
}

export async function getPublishedPost(slug: string): Promise<BackendPost | null> {
  const data = await request<{ post: BackendPost }>(
    `/api/public/posts/${encodeURIComponent(slug)}`,
  );
  return data?.post ?? null;
}
