import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // important: no caching

export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL;

  if (!BACKEND_URL) {
    return NextResponse.json(
      { status: "backend_url_missing" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // avoid hanging
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "backend_offline" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "online" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "backend_unreachable" },
      { status: 503 }
    );
  }
}
