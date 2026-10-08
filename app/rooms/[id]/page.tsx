import RoomDetails from "@/components/room/RoomDetails";
import { notFound } from "next/navigation";
import { cache } from "react";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

const getRoom = cache(async (id: string) => {
  const res = await fetch(`${process.env.API_URL}/api/rooms/${id}`, {
    cache: "no-store",
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
