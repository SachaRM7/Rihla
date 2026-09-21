import { AppShell } from "@/components/app-shell";

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AppShell initialRoute={{ kind: "series", slug }} />;
}
