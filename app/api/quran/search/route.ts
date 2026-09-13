import { NextResponse } from "next/server";
import { searchQuran } from "@/lib/quran/source";

export const revalidate = 86_400;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json(
      { error: "Saisissez entre 2 et 80 caractères." },
      { status: 400 },
    );
  }

  try {
    const data = await searchQuran(query);
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("Unable to search Quran", error);
    return NextResponse.json(
      { error: "La recherche est momentanément indisponible." },
      { status: 502 },
    );
  }
}
