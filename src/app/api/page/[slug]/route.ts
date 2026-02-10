import { NextResponse } from "next/server";
import { fetchPageBySlug } from "@/graphql/queries/getPageBySlug";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const page = await fetchPageBySlug(slug);
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

