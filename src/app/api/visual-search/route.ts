import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { searchQuery, imageBase64: _imageBase64 } = (await req.json()) as {
    searchQuery: string;
    imageBase64?: string;
  };

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: searchQuery,
    api_key: process.env.SERP_API_KEY!,
    num: "6",
  });

  const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
  const data = await response.json();

  const shoppingResults = data.shopping_results?.slice(0, 6) || [];

  return NextResponse.json({ shoppingResults });
}
