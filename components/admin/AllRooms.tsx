"use client";

import { IRoom } from "@/backend/models/room";
import { useDeleteRoomMutation } from "@/redux/api/roomApi";
import SimpleDataTable, { DataTableData } from "./SimpleDataTable";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

interface Props {
  data: {
    rooms: IRoom[];
  };
}

const AllRooms = ({ data }: Props) => {
  const rooms = data?.rooms;
  const router = useRouter();

  const [deleteRoom, { error, isSuccess }] = useDeleteRoomMutation();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      router.refresh();
      toast.success("Room deleted");
    }
  }, [error, isSuccess, router]);

  const setRooms = () => {
    const data: DataTableData = {
      columns: [
        {
          label: "Room ID",
          field: "id",
          sort: "asc",
        },
        {
          label: "Name",
          field: "name",
          sort: "asc",
        },
        {
          label: "Actions",
          field: "actions",
          sort: "asc",
        },
      ],
      rows: [],
    };

    rooms?.forEach((room) => {
      data?.rows?.push({
        id: room._id?.toString(),
        name: room.name,
        actions: (
          <div className="table-actions">
            <Link
              href={`/admin/rooms/${room._id}`}
              className="btn btn-outline-primary btn-sm"
            >
              Edit
            </Link>
            <Link
              href={`/admin/rooms/${room._id}/upload_images`}
              className="btn btn-outline-success btn-sm"
            >
              Images
            </Link>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => deleteRoomHandler(room?._id?.toString() ?? "")}
            >
              Delete
            </button>
          </div>
        ),
      });
    });

    return data;
  };

  const deleteRoomHandler = (id: string) => {
    if (window.confirm("Delete this room? This action cannot be undone.")) {
      deleteRoom(id);
    }
  };

  return (
    <div>
      <div className="resource-page-heading">
      <h2>
        {`${rooms?.length} Room(s)`}
      </h2>
      <Link
          href="/admin/rooms/new"
          className="btn btn-primary-roomi"
        >
          Create room
        </Link>
      </div>

      <SimpleDataTable data={setRooms()} className="px-3" />
    </div>
  );
};

export default AllRooms;
