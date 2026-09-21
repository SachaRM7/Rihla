import { AppShell } from "@/components/app-shell";

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AppShell initialRoute={{ kind: "creator", slug }} />;
}
