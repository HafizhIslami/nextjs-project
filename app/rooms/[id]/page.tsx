import Error from "@/app/error";
import RoomDetails from "@/components/room/RoomDetails";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

const getRooms = async (id: string) => {
  const res = await fetch(`${process.env.API_URL}/api/rooms/${id}`);
  return res.json();
};

export default async function RoomDetailsPage({ params }: Props) {
  const data = await getRooms(params?.id);

  if (data?.message) {
    <Error error={data} />;
  }
  return <RoomDetails data={data} />;
}

export async function generateMetadata({params}:Props){
  const data = await getRooms(params.id);

  return {
    title: data?.room?.title,
  }
}