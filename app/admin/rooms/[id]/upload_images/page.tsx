import Error from "@/app/error";
import UploadRoomImages from "@/components/admin/UploadRoomImages";
import { getServerApiUrl, getTenantForwardHeaders } from "@/helpers/serverTenantRequest";

export const metadata = {
  title: "Upload Room Images - ADMIN",
};

const getRoom = async (id: string) => {
  const res = await fetch(getServerApiUrl(`/api/rooms/${id}`), {
    headers: getTenantForwardHeaders(),
    next: {
      tags: ["RoomDetails"],
    },
  });
  return res.json();
};

export default async function AdminUploadImagesPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getRoom(params?.id);

  if (data?.errMessage) {
    return <Error error={data} />;
  }

  return <UploadRoomImages data={data} />;
}
