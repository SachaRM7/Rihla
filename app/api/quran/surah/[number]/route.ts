import { NextResponse } from "next/server";
import { DEFAULT_RECITER_ID, isAllowedReciter } from "@/lib/quran/constants";
import { getSurahDetail } from "@/lib/quran/source";

export const revalidate = 86_400;

type RouteContext = {
  params: Promise<{ number: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { number: rawNumber } = await context.params;
  const number = Number(rawNumber);
  const reciter = new URL(request.url).searchParams.get("reciter") ?? DEFAULT_RECITER_ID;

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 114 ||
    !isAllowedReciter(reciter)
  ) {
    return NextResponse.json(
      { error: "Sourate ou récitant invalide." },
      { status: 400 },
    );
  }

  try {
    const data = await getSurahDetail(number, reciter);
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error(`Unable to load Quran surah ${number}`, error);
    return NextResponse.json(
      { error: "Cette sourate est momentanément indisponible." },
      { status: 502 },
    );
  }
}
