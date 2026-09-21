import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function QuranAyahPage({ params }: { params: Promise<{ surah: string; ayah: string }> }) {
  const { surah, ayah } = await params;
  const surahNumber = Number(surah);
  const ayahNumber = Number(ayah);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > 286) notFound();
  return <AppShell initialRoute={{ kind: "quran", surah: surahNumber, ayah: ayahNumber }} />;
}
