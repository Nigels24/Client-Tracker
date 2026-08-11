import ClientDetailView from "@/features/clients/components/ClientDetailView";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <ClientDetailView clientId={Number(clientId)} />;
}
