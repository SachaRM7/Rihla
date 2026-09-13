import { NextResponse } from "next/server";
import { getSurahCatalog } from "@/lib/quran/source";

export const revalidate = 86_400;

export async function GET() {
  try {
    const catalog = await getSurahCatalog();
    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Unable to load Quran catalog", error);
    return NextResponse.json(
      { error: "Le catalogue du Coran est momentanément indisponible." },
      { status: 502 },
    );
  }
}
