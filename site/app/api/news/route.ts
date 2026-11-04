import { NextResponse } from "next/server";

const BACKEND_URL =   process.env.BACKEND_URL ||   process.env.NEXT_PUBLIC_BACKEND_URL ||   "http://localhost:5013";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/posts${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ posts: [] }, { status: 503 });
  }
}
