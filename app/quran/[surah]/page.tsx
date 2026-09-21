import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function QuranSurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const number = Number(surah);
  if (!Number.isInteger(number) || number < 1 || number > 114) notFound();
  return <AppShell initialRoute={{ kind: "quran", surah: number }} />;
}
