import RoomDetails from "@/components/room/RoomDetails";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerApiUrl, getTenantForwardHeaders } from "@/helpers/serverTenantRequest";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

const getRoom = cache(async (id: string) => {
  const res = await fetch(getServerApiUrl(`/api/rooms/${id}`), {
    cache: "no-store",
    headers: getTenantForwardHeaders(),
  });
  return res.json();
});

export default async function RoomDetailsPage({ params }: Props) {
  const data = await getRoom(params?.id);

  if (!data?.room) notFound();
  return <RoomDetails data={data} />;
}

export async function generateMetadata({ params }: Props) {
  const data = await getRoom(params.id);

  return {
    title: data?.room?.name || "Room details",
    description: data?.room?.description,
  };
}
